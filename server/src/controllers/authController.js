import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../config/db.js';
import { generateToken } from '../middleware/auth.js';
import admin, { isFirebaseReady, verifyFirebaseToken } from '../config/firebase.js';
import { sendWelcomeEmail } from '../services/emailService.js';

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await query(
      `INSERT INTO users (name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, firebase_uid, name, email, phone, photo_url, is_admin, member_since`,
      [name, email.toLowerCase(), passwordHash, phone || null]
    );

    const user = newUser.rows[0];
    const token = generateToken(user);

    // Trigger async welcome email via Nodemailer
    sendWelcomeEmail(user.email, user.name);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const userRes = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = userRes.rows[0];
    if (!user.password_hash) {
      return res.status(400).json({ success: false, message: 'Account exists with Google Login. Please sign in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { idToken, googleUser } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }

    // The identity always comes from the verified token. Values supplied in
    // `googleUser` are only used to fill in optional display details, never
    // to establish who the caller is.
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(idToken);
    } catch (verifyError) {
      return res.status(401).json({
        success: false,
        message: verifyError.message || 'Could not verify your Google sign-in. Please try again.',
      });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name || googleUser?.name || googleUser?.displayName;
    const picture = decodedToken.picture || googleUser?.photoURL || googleUser?.photo_url;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account missing email address' });
    }

    const cleanEmail = email.toLowerCase();
    const cleanName = name || cleanEmail.split('@')[0];

    let userRes = await query('SELECT * FROM users WHERE email = $1 OR firebase_uid = $2', [cleanEmail, uid]);
    let user;

    if (userRes.rows.length === 0) {
      const newUser = await query(
        `INSERT INTO users (firebase_uid, name, email, photo_url)
         VALUES ($1, $2, $3, $4)
         RETURNING id, firebase_uid, name, email, phone, photo_url, is_admin, member_since`,
        [uid, cleanName, cleanEmail, picture || null]
      );
      user = newUser.rows[0];
      sendWelcomeEmail(user.email, user.name);
    } else {
      user = userRes.rows[0];
      await query(
        'UPDATE users SET firebase_uid = COALESCE($1, firebase_uid), name = COALESCE($2, name), photo_url = COALESCE($3, photo_url), updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [uid, cleanName, picture || null, user.id]
      );
      user.firebase_uid = uid;
      user.name = cleanName;
      if (picture) user.photo_url = picture;
    }

    const token = generateToken(user);
    const { password_hash, ...userClean } = user;

    res.json({
      success: true,
      message: 'Google Sign-In successful',
      token,
      user: {
        ...userClean,
        photoURL: userClean.photo_url || picture
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const cleanEmail = req.body.email.toLowerCase();
    // Always the same reply whether or not the account exists, so this
    // endpoint cannot be used to probe for registered emails.
    const genericResponse = {
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    };

    if (!isFirebaseReady()) {
      return res.status(503).json({
        success: false,
        message: 'Password reset is unavailable right now. Please try again later.',
      });
    }

    const userRes = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (userRes.rows.length === 0) return res.json(genericResponse);

    // Email/password accounts live only in Postgres. Firebase must know the
    // address (with a password provider) before its reset email can be sent
    // from the client, so create the Firebase user on first request.
    try {
      await admin.auth().getUserByEmail(cleanEmail);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          email: cleanEmail,
          emailVerified: true,
          password: crypto.randomBytes(32).toString('hex'),
        });
      } else {
        throw err;
      }
    }

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { idToken, newPassword } = req.body;

    // The ID token was minted by signing in with the freshly reset Firebase
    // password, so a valid token proves the caller completed the email link.
    let decoded;
    try {
      decoded = await verifyFirebaseToken(idToken);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Your reset session has expired. Please request a new link.',
      });
    }

    const email = decoded.email?.toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Reset token is missing an email address.' });
    }

    const userRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found for this email.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE users
       SET password_hash = $1, firebase_uid = COALESCE(firebase_uid, $2), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [passwordHash, decoded.uid, userRes.rows[0].id]
    );

    res.json({ success: true, message: 'Password updated successfully. You can now sign in.' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, photo_url } = req.body;

    const updatedUser = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           photo_url = COALESCE($3, photo_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, firebase_uid, name, email, phone, photo_url, is_admin, member_since`,
      [name, phone, photo_url, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
