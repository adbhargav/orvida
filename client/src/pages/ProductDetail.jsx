import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Heart, Share2, Check, ShoppingBag, ShieldCheck, Truck, RotateCcw, ChevronRight, ChevronDown, ChevronUp, Sparkles, MapPin, Award, ThumbsUp, Play } from 'lucide-react';
import { PRODUCTS, REVIEWS } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/product/ProductCard';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const product = PRODUCTS.find(p => p.slug === slug) || PRODUCTS[0];
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [quantity, setQuantity] = useState(1);
  
  // Pincode Checker state
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);

  // Accordions state
  const [openAccordion, setOpenAccordion] = useState('description');

  // Magnifier state
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false });
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveMediaIndex(0);
    setSelectedVariant(product.variants?.[0] || null);
  }, [slug, product]);

  const isLiked = isInWishlist(product.id);
  const currentPrice = (product.discountPrice || product.price) + (selectedVariant?.priceDelta || 0);
  const originalPrice = product.price + (selectedVariant?.priceDelta || 0);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y, show: true });
  };

  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length < 6) return;
    if (product.pincodes.includes(pincode.trim())) {
      setPincodeStatus({ success: true, message: 'Delivering in 2-3 business days with White-Glove Nursery Express.' });
    } else {
      setPincodeStatus({ success: false, message: 'Currently unavailable for standard delivery to this pincode. Try a metro pincode (e.g. 560001).' });
    }
  };

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedVariant, quantity);
    navigate('/checkout');
  };

  const relatedProducts = PRODUCTS.filter(p => p.id !== product.id && p.categoryId === product.categoryId).slice(0, 4);

  return (
    <div className="pb-24 space-y-16 bg-[#FAF9F6]">
      
      {/* Main Top Section: Sticky 60% Left / 40% Right */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#154734] mb-6 uppercase font-bold tracking-widest">
          <Link to="/" className="hover:underline">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link to={`/category/${product.categorySlug}`} className="hover:underline">{product.categoryName}</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT 60% COLUMN: Sticky Gallery */}
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
            <div className="flex flex-col-reverse md:flex-row gap-4">
              
              {/* Thumbnail Rail */}
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[520px] pb-2 md:pb-0 scrollbar-none">
                {product.images?.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeMediaIndex === idx
                        ? 'border-[#154734] scale-105 shadow-md ring-2 ring-[#154734]/30'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="Gallery thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Primary Image with Magnifier Zoom Lens */}
              <div
                className="relative flex-1 aspect-[4/5] rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-md cursor-crosshair group"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setZoomPos(prev => ({ ...prev, show: false }))}
              >
                <img
                  src={product.images[activeMediaIndex]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover transition duration-300"
                />

                {/* Magnifier Lens Window */}
                {zoomPos.show && (
                  <div
                    className="absolute inset-0 z-20 pointer-events-none rounded-3xl overflow-hidden shadow-2xl border-2 border-[#154734]"
                    style={{
                      backgroundImage: `url(${product.images[activeMediaIndex]?.url})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: '220%'
                    }}
                  />
                )}

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`absolute top-4 right-4 z-30 p-3 rounded-full shadow-md transition-all ${
                    isLiked ? 'bg-[#154734] text-white scale-110' : 'bg-white/90 text-slate-700 hover:text-[#154734] hover:scale-110'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-white text-white' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 40% COLUMN: Scrollable Product Details */}
          <div className="lg:col-span-5 space-y-6 text-slate-900">
            
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">
                {product.categoryName} · {product.subcategoryName}
              </span>

              <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 font-bold mt-1 mb-3 leading-snug">
                {product.name}
              </h1>

              {/* Review Micro-summary Anchor */}
              <a href="#reviews" className="flex items-center gap-2 mb-4 group w-fit">
                <div className="flex text-[#C9972B]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C9972B]" />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#154734] group-hover:underline">
                  {product.avgRating} ({product.reviewCount} verified ratings)
                </span>
              </a>

              {/* Price Block */}
              <div className="p-4 rounded-2xl bg-[#F0F5F2] border border-gray-200 flex items-baseline gap-3 mb-4">
                <span className="font-serif font-bold text-3xl text-[#154734]">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through font-medium">
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 ml-auto">Inclusive of all luxury taxes & packaging</span>
              </div>
            </div>

            {/* Variant Selector Swatches */}
            {product.variants?.length > 0 && (
              <div className="space-y-3 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <label className="text-xs font-bold uppercase tracking-wider text-[#154734] block">
                  Select Size / Planter Finish:
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                        selectedVariant?.id === v.id
                          ? 'bg-[#154734] text-white border-[#154734] shadow-sm scale-105'
                          : 'bg-gray-50 text-slate-700 border-gray-200 hover:border-[#154734]'
                      }`}
                    >
                      {v.value} {v.priceDelta > 0 ? `(+₹${v.priceDelta})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Add to Cart CTAs */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-4">
                {/* Stepper */}
                <div className="flex items-center border border-gray-300 rounded-full bg-gray-50 px-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2 py-1 text-base font-bold text-slate-700 hover:text-[#154734]"
                  >
                    -
                  </button>
                  <span className="px-3 text-sm font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2 py-1 text-base font-bold text-slate-700 hover:text-[#154734]"
                  >
                    +
                  </button>
                </div>

                {/* Primary Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-4 px-6 rounded-full font-extrabold text-xs tracking-widest flex items-center justify-center gap-2 transition duration-300 ${
                    addedSuccess
                      ? 'bg-[#154734] text-white'
                      : 'bg-[#154734] hover:bg-[#0F3526] text-white shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>ADDED TO BASKET!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>ADD TO CART · ₹{(currentPrice * quantity).toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Buy Now Button */}
              <button
                onClick={handleBuyNow}
                className="w-full bg-white hover:bg-gray-50 text-[#154734] border-2 border-[#154734] py-3.5 rounded-full font-bold text-xs tracking-widest transition shadow-sm"
              >
                BUY NOW WITH EXPRESS CHECKOUT
              </button>
            </div>

            {/* Pincode Availability Checker */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2">
              <label className="text-xs font-bold text-[#154734] flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Check Pincode Delivery Availability
              </label>
              <form onSubmit={handlePincodeCheck} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Enter 6-digit Pincode (e.g. 560001)"
                  className="bg-gray-50 border border-gray-300 rounded-full px-4 py-2 text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-[#154734] flex-1"
                />
                <button
                  type="submit"
                  className="bg-[#154734] hover:bg-[#0F3526] text-white px-4 py-2 rounded-full text-xs font-bold transition"
                >
                  CHECK
                </button>
              </form>
              {pincodeStatus && (
                <p className={`text-xs mt-1 font-semibold ${pincodeStatus.success ? 'text-[#154734]' : 'text-red-600'}`}>
                  {pincodeStatus.message}
                </p>
              )}
            </div>

            {/* Trust Row */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                <Truck className="w-4 h-4 text-[#154734]" />
                <span>Express Temperature Transport</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#154734]" />
                <span>7-Day Live Health Guarantee</span>
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              
              {/* Accordion 1: Description & Story */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'description' ? null : 'description')}
                  className="w-full p-4 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#154734]"
                >
                  <span>Description & Heritage Story</span>
                  {openAccordion === 'description' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openAccordion === 'description' && (
                  <div className="p-4 pt-0 text-xs text-slate-700 leading-relaxed whitespace-pre-line border-t border-gray-100">
                    {product.description}
                  </div>
                )}
              </div>

              {/* Accordion 2: Botanical Care Guide */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}
                  className="w-full p-4 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#154734]"
                >
                  <span>Care Instructions & Sunlight Guide</span>
                  {openAccordion === 'care' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openAccordion === 'care' && (
                  <div className="p-4 pt-0 text-xs text-slate-700 leading-relaxed whitespace-pre-line border-t border-gray-100">
                    {product.careInstructions || 'Standard care: Water when topsoil dries. Keep in bright indirect light.'}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Storytelling Strip for Arts / Heritage Items */}
      {product.craftsmanshipStory && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-200 shadow-md grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-3">
              <span className="px-3 py-1 rounded-full bg-[#F0F5F2] text-[#154734] text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 w-fit border border-[#154734]/20">
                <Award className="w-3.5 h-3.5 text-[#154734]" /> Master Artisan Craftsmanship
              </span>
              <h3 className="font-serif text-2xl text-slate-900 font-bold">Origin & Ancestral Heritage</h3>
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                {product.craftsmanshipStory}
              </p>
            </div>
            <div className="md:col-span-4 flex justify-center">
              <div className="p-4 rounded-2xl bg-[#F0F5F2] border border-gray-200 text-center">
                <Sparkles className="w-8 h-8 text-[#154734] mx-auto mb-2" />
                <h5 className="font-display font-bold text-xs text-slate-900">Handcrafted Certificate</h5>
                <p className="text-[10px] text-slate-500 mt-1">Includes signed lineage certificate by master artisan</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cross-Sell Bundle: "Complete the Look" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-md space-y-6">
          <div className="flex justify-between items-end border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Curated Styling Bundle</span>
              <h3 className="font-display font-bold text-xl md:text-2xl text-slate-900">Complete The Luxury Look</h3>
            </div>
            <span className="text-xs text-[#154734] font-bold bg-[#F0F5F2] px-3 py-1 rounded-full border border-[#154734]/20">
              Bundle Discount: Save 15%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <img src={product.images[0]?.url} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</h4>
                <p className="text-xs font-bold text-[#154734]">₹{currentPrice}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80" alt="Botanical Serum" className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Organic Gold Botanical Serum (250ml)</h4>
                <p className="text-xs font-bold text-[#154734]">₹499</p>
              </div>
            </div>

            <button
              onClick={() => {
                addToCart(product, selectedVariant, 1);
                alert('Bundle added to cart with 15% discount!');
              }}
              className="bg-[#154734] hover:bg-[#0F3526] text-white py-4 px-6 rounded-full font-bold text-xs tracking-wider shadow-md hover:scale-105 transition"
            >
              ADD ENTIRE BUNDLE · ₹{Math.round((currentPrice + 499) * 0.85).toLocaleString('en-IN')}
            </button>
          </div>
        </div>
      </section>

      {/* Reviews Section Anchor */}
      <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Verified Feedback</span>
            <h2 className="font-display font-extrabold text-3xl text-slate-900">Client Reviews & Photos</h2>
          </div>
          <button
            onClick={() => alert('Review submission is available for verified purchasers after delivery.')}
            className="bg-white text-[#154734] border border-[#154734] px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#F0F5F2] transition"
          >
            WRITE A REVIEW
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating Breakdown */}
          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4 h-fit">
            <div className="text-center space-y-1">
              <span className="font-serif font-extrabold text-5xl text-[#154734]">{product.avgRating}</span>
              <div className="flex justify-center text-[#C9972B]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#C9972B]" />
                ))}
              </div>
              <p className="text-xs text-slate-500">Based on {product.reviewCount} customer reviews</p>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-100 text-xs">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="w-8 font-bold text-[#154734]">{rating} ★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#154734] rounded-full"
                      style={{ width: rating === 5 ? '88%' : rating === 4 ? '10%' : '2%' }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-400">{rating === 5 ? '88%' : rating === 4 ? '10%' : '2%'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {REVIEWS.map(rev => (
              <div key={rev.id} className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={rev.userAvatar} alt={rev.userName} className="w-10 h-10 rounded-full object-cover border border-[#154734]" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{rev.userName}</h4>
                      <p className="text-[10px] text-[#154734] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#154734]" /> Verified Purchase
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">{rev.date}</span>
                </div>

                <div className="flex text-[#C9972B]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#C9972B]" />
                  ))}
                </div>

                <h5 className="font-bold text-sm text-slate-900">{rev.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>

                {rev.images?.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    {rev.images.map((img, idx) => (
                      <img key={idx} src={img} alt="review photo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky Mobile Add to Cart Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-4 z-40 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] text-slate-500 block line-clamp-1">{product.name}</span>
          <span className="font-serif font-bold text-lg text-[#154734]">₹{currentPrice.toLocaleString('en-IN')}</span>
        </div>
        <button
          onClick={handleAddToCart}
          className="bg-[#154734] text-white px-6 py-3 rounded-full font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-md"
        >
          <ShoppingBag className="w-4 h-4" /> ADD TO CART
        </button>
      </div>

    </div>
  );
}
