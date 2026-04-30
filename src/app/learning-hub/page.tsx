'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type Category    = 'all' | 'crop-care' | 'fertilizer' | 'pesticides' | 'cost-reduction' | 'extreme-weather' | 'tips-guides';
type ContentType = 'video' | 'infographic' | 'guide' | 'tip';
type Source      = 'static' | 'dynamic';

interface LearningItem {
  id: string;
  type: ContentType;
  category: Category;
  title: string;
  description: string;
  youtubeId?: string;
  imageUrl?: string;
  content?: string;
  duration?: string;
  tags: string[];
  readTime?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  source: Source;
  authorName?: string;
  authorRole?: 'admin' | 'specialist' | 'farmer';
  flagCount?: number;
}

interface UserBehavior {
  interests: string[];
  recentViewTags: string[];
  recentCategories: string[];
  recentSearches: string[];
  hasData: boolean;
}

function scoreItem(item: LearningItem, behavior: UserBehavior): number {
  const itemTags = item.tags.map(t => t.toLowerCase());
  let score = 0;

  // Interest match: +3 per interest that overlaps with an item tag
  for (const interest of behavior.interests) {
    const iLow = interest.toLowerCase();
    if (itemTags.some(t => t.includes(iLow) || iLow.includes(t))) score += 3;
  }

  // View behavior match: +2 per tag shared with recently viewed content
  for (const viewTag of behavior.recentViewTags) {
    if (itemTags.includes(viewTag)) score += 2;
  }

  // Category match: +2 if this category was recently clicked
  if (behavior.recentCategories.includes(item.category)) score += 2;

  // Search history match: +1 per search query whose words appear in tags/title
  const titleLow = item.title.toLowerCase();
  for (const q of behavior.recentSearches) {
    const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (words.some(w => itemTags.some(t => t.includes(w)) || titleLow.includes(w))) score += 1;
  }

  return score;
}

// ── Static curated content (always shown) ─────────────────────────────────────
const staticItems: LearningItem[] = [
  // Infographics with content descriptions
  { id: 'i1', source: 'static', type: 'infographic', category: 'fertilizer',      title: 'Fertilizer Application Calendar',         description: "A visual month-by-month guide for applying NPK fertilizers aligned with Bangladesh's Boro and Aman cultivation seasons.", 
    content: "📅 FERTILIZER APPLICATION CALENDAR\n\n🥚 BASAL (At Planting):\n• Urea: 80 kg/ha\n• TSP: 120 kg/ha\n• MoP: 60 kg/ha\n\n🌱 TOP DRESSING - 1st (20-25 days after transplanting):\n• Urea: 60 kg/ha\n\n🌾 TOP DRESSING - 2nd (40-45 days after transplanting):\n• Urea: 60 kg/ha\n• MoP: 40 kg/ha\n\n🗓️ Season Timing:\n• Boro: December - April\n• Aman: June - December\n• Aus: April - August", tags: ['NPK', 'Seasonal', 'Calendar'],            difficulty: 'Beginner' },
  { id: 'i2', source: 'static', type: 'infographic', category: 'pesticides',      title: 'Common Crop Pests Identification Chart',   description: 'Visual identification guide for 20+ common pests found in rice, vegetables, and fruit crops with recommended treatments.',   
    content: "🐛 COMMON CROP PESTS IDENTIFICATION\n\n🍚 RICE PESTS:\n• Stem Borer: Yellow larvae in stem, dead hearts\n• Brown Planthopper: Yellowing, hopper burn\n• Rice Bug: Grain damage, empty panicles\n\n🥬 VEGETABLE PESTS:\n• Aphids: Curled leaves, sticky honeydew\n• Fruit Borers: Holes in fruits, larval entry\n• Whiteflies: Yellow spots, sooty mold\n\n🍎 FRUIT PESTS:\n• Fruit Fly: Rotting fruits, maggot inside\n• Mango Hopper: Flower drop, sooty mold\n• Citrus Leaf Miner: Silver trails on leaves\n\n💊 TREATMENT TIPS:\n• Use pheromone traps for monitoring\n• Apply neem oil for organic control\n• Rotate pesticides to prevent resistance", tags: ['Pests', 'Identification', 'Treatment'],    difficulty: 'Beginner' },
  { id: 'i3', source: 'static', type: 'infographic', category: 'crop-care',       title: 'Soil Health Indicators at a Glance',       description: 'Color-coded guide showing how to read your soil: pH levels, moisture signs, and nutrient deficiency symptoms in leaves.',   
    content: "🌍 SOIL HEALTH INDICATORS\n\n📊 pH LEVELS:\n• pH < 5.0: Very acidic - Add lime\n• pH 5.0-6.0: Acidic - Suitable for most crops\n• pH 6.0-7.0: Neutral - Ideal for all crops\n• pH 7.0-8.0: Alkaline - Add sulfur\n• pH > 8.0: Very alkaline - Problematic\n\n🌿 NUTRIENT DEFICIENCY SIGNS:\n• Nitrogen: Yellow older leaves first\n• Phosphorus: Purple tint on leaves\n• Potassium: Brown leaf edges\n• Iron: Yellow young leaves, green veins\n• Zinc: Small leaves, rosetting\n\n💧 MOISTURE TESTS:\n• Squeeze: Ball holds = adequate moisture\n• Probe: Dark soil 6\" deep = good\n• Cracks: 2cm+ = needs irrigation", tags: ['Soil', 'pH', 'Nutrients'],                 difficulty: 'Intermediate' },
  { id: 'i4', source: 'static', type: 'infographic', category: 'extreme-weather', title: 'Cyclone & Storm Preparedness Checklist',   description: 'A quick visual checklist farmers in coastal and river-basin areas should follow 48 hours before a major storm.',            
    content: "🌀 CYCLONE PREPAREDNESS CHECKLIST\n\n📅 48 HOURS BEFORE:\n☐ Harvest mature crops early\n☐ Secure stored grains in waterproof containers\n☐ Move livestock to higher ground\n☐ Prepare emergency fodder\n\n📅 24 HOURS BEFORE:\n☐ Reinforce farm structures\n☐ Drain excess water from fields\n☐ Stake tall crops (tomato, banana)\n☐ Harvest vegetables for market\n\n⛈️ DURING STORM:\n☐ Stay indoors, avoid flooding\n☐ Keep emergency kit ready\n☐ Monitor weather updates\n\n🌊 AFTER FLOOD:\n☐ Assess crop damage\n☐ Drain standing water\n☐ Apply fungicide to prevent disease\n☐ Document damage for insurance", tags: ['Cyclone', 'Storm', 'Checklist'],            difficulty: 'Beginner' },
  { id: 'i5', source: 'static', type: 'infographic', category: 'cost-reduction',  title: 'Farm Cost Breakdown & Where to Save',      description: 'Pie chart and tips showing typical farm cost breakdown — seeds, labour, fertilizer, irrigation — and highest-impact savings.', 
    content: "💰 FARM COST BREAKDOWN\n\n📊 TYPICAL EXPENSE DISTRIBUTION:\n• Seeds: 15% - Can save 30% with bulk buying\n• Fertilizer: 25% - Can save 20% with organic amendments\n• Labor: 30% - Can save 25% with mechanization\n• Irrigation: 15% - Can save 40% with drip systems\n• Pesticides: 10% - Can save 35% with IPM\n• Miscellaneous: 5%\n\n💡 HIGH-IMPACT SAVINGS:\n1. Cooperative seed purchasing: ৳3,000-5,000/bigha saved\n2. Organic compost: 40% fertilizer cost reduction\n3. Drip irrigation: 50% water, 30% labor savings\n4. IPM practices: 35% pesticide cost reduction\n5. Seed saving: ৳2,000-3,000/bigha saved annually", tags: ['Budget', 'Savings', 'Analysis'],            difficulty: 'Beginner' },
  
  // Guides with full content
  { id: 'g1', source: 'static', type: 'guide', category: 'crop-care',       title: 'Complete Guide to Post-Harvest Crop Storage',        description: 'Step-by-step instructions for proper drying, cleaning, grading, and storing rice and vegetables to reduce post-harvest losses by 30%.', 
    content: "📖 COMPLETE GUIDE TO POST-HARVEST STORAGE\n\nStep 1: Proper Drying\n• Sun dry paddy to 14% moisture content\n• Spread in thin layers (5-7 cm)\n• Dry for 3-5 days, turn every 2-3 hours\n• Test by biting - grain should crack, not squash\n\nStep 2: Cleaning & Grading\n• Remove debris, broken grains, and impurities\n• Grade by size and quality\n• Separate damaged produce for immediate use\n\nStep 3: Proper Storage\n• Use airtight containers or godowns\n• Place on pallets, not direct floor\n• Maintain 60-70% relative humidity\n• Check weekly for pests and moisture\n\nStep 4: Vegetable Storage\n• Leafy vegetables: Store in perforated bags in cool place\n• Root vegetables: Layer with sand in crates\n• Tomatoes: Store at 10-12°C, not refrigerated\n• Potatoes: Keep in dark, cool, ventilated area\n\n💡 Pro Tips:\n• Use neem leaves to repel storage pests\n• Add silica gel packets to reduce moisture\n• First-in-first-out rotation method", readTime: '8 min read',  tags: ['Storage', 'Post-Harvest', 'Rice'],       difficulty: 'Intermediate' },
  { id: 'g2', source: 'static', type: 'guide', category: 'fertilizer',      title: 'Making Compost at Home: A Step-by-Step Guide',       description: 'How to turn kitchen waste and crop residues into high-quality compost that enriches soil and reduces chemical fertilizer needs.',     
    content: "📖 MAKING COMPOST AT HOME\n\nMaterials Needed:\n• Kitchen waste (vegetable peels, fruit scraps)\n• Crop residues (straw, leaves, husks)\n• Cow dung or chicken manure\n• Water and bamboo stick for aeration\n\nStep 1: Choose Location\n• Shaded area, 1m x 1m x 1m pit or bin\n• Good drainage, easy access\n\nStep 2: Layer Materials\n• Layer 1: Dry leaves/straw (6 inches)\n• Layer 2: Green waste/kitchen scraps (4 inches)\n• Layer 3: Cow dung (2 inches)\n• Repeat layers until pile is 3-4 feet high\n\nStep 3: Maintain Moisture\n• Keep pile moist like a wrung sponge\n• Turn every 2-3 weeks for aeration\n• Add water if pile dries out\n\nStep 4: Harvest\n• Ready in 6-8 weeks when dark, crumbly\n• Smells like earth, not rotten\n• Apply 2-3 tons per bigha\n\n💡 Quality Tips:\n• Avoid meat, dairy, oily foods\n• Chop materials smaller = faster decomposition\n• Add lime occasionally for pH balance", readTime: '6 min read',  tags: ['Compost', 'Organic', 'DIY'],             difficulty: 'Beginner' },
  { id: 'g3', source: 'static', type: 'guide', category: 'extreme-weather', title: 'Drought Management & Water Conservation',             description: 'Emergency measures for crops during water scarcity: mulching techniques, drought-tolerant varieties, and irrigation scheduling.',       
    content: "📖 DROUGHT MANAGEMENT GUIDE\n\n1. IMMEDIATE ACTIONS:\n• Apply mulch to reduce evaporation by 50%\n• Water early morning or evening (not midday)\n• Use drip irrigation - 60% more efficient\n• Harvest rain water in ponds and tanks\n\n2. MULCHING TECHNIQUES:\n• Organic mulch: straw, leaves, grass (3-4 inches)\n• Plastic mulch: silver/white on soil, black on beds\n• Apply after irrigation or rain\n\n3. DROUGHT-TOLERANT VARIETIES:\n• Rice: BRRI dhan 56, 71, 75\n• Wheat: BARI wheat 25, 26\n• Maize: BARI maize 9, 11\n• Vegetables: Okra, eggplant, pumpkin\n\n4. IRRIGATION SCHEDULING:\n• Check soil moisture at 4-inch depth\n• Water when top 2 inches are dry\n• Focus on critical stages: flowering, fruiting\n• Alternate row irrigation for row crops\n\n5. LONG-TERM SOLUTIONS:\n• Build check dams and farm ponds\n• Practice rainwater harvesting\n• Adopt conservation tillage\n• Grow cover crops for moisture retention", readTime: '10 min read', tags: ['Drought', 'Water', 'Mulching'],          difficulty: 'Advanced' },
  { id: 'g4', source: 'static', type: 'guide', category: 'pesticides',      title: 'Integrated Pest Management (IPM) for Small Farms',   description: 'A holistic approach combining biological controls, crop rotation, and targeted chemical use to manage pests sustainably.',             
    content: "📖 INTEGRATED PEST MANAGEMENT (IPM)\n\n1. PREVENTIVE MEASURES:\n• Use resistant varieties\n• Rotate crops annually\n• Maintain field sanitation\n• Proper plant spacing for airflow\n• Remove and destroy infected plant parts\n\n2. MONITORING:\n• Check crops twice weekly\n• Use yellow sticky traps for insects\n• Set up pheromone traps\n• Economic threshold: action level\n\n3. BIOLOGICAL CONTROL:\n• Release Trichogramma wasps for stem borer\n• Use neem oil spray (5ml/liter water)\n• Encourage beneficial insects: ladybirds, spiders\n• Apply Bacillus thuringiensis (Bt) for caterpillars\n\n4. PHYSICAL CONTROL:\n• Hand-pick large pests (caterpillars, beetles)\n• Use bird perches to attract predators\n• Install insect-proof nets for vegetables\n• Light traps for nocturnal insects\n\n5. CHEMICAL (Last Resort):\n• Use systemic pesticides, not contact\n• Rotate modes of action\n• Apply at pest's vulnerable stage\n• Follow pre-harvest interval guidelines", readTime: '12 min read', tags: ['IPM', 'Biological Control', 'Sustainable'], difficulty: 'Advanced' },
  { id: 'g5', source: 'static', type: 'guide', category: 'cost-reduction',  title: 'Cooperative Buying: How to Save on Seeds & Inputs',  description: "How to form or join a farmers' cooperative for bulk purchasing — including legal steps and example savings calculations.",             
    content: "📖 COOPERATIVE BUYING GUIDE\n\n1. FORM A GROUP:\n• Minimum 10-20 farmers\n• Choose a leader and treasurer\n• Set monthly contribution (৳100-200)\n• Register with Department of Agricultural Extension\n\n2. BULK PURCHASE BENEFITS:\n• Seeds: 20-30% discount\n• Fertilizer: 15-25% discount\n• Pesticides: 10-20% discount\n• Equipment: 30-50% discount\n\n3. EXAMPLE SAVINGS:\nIndividual: 50kg Urea = ৳1,500\nCooperative (20 farmers): 1000kg = ৳1,200/50kg\nAnnual savings: ৳6,000 per farmer on urea alone!\n\n4. STEPS TO ORGANIZE:\n• Hold meeting, discuss benefits\n• Collect list of needed inputs\n• Contact suppliers, get quotes\n• Pool funds, place order\n• Distribute based on contribution\n\n5. EXPAND OPPORTUNITIES:\n• Share machinery (tractor, harvester)\n• Joint marketing of produce\n• Storage facilities\n• Processing units", readTime: '7 min read',  tags: ['Cooperative', 'Seeds', 'Bulk Buying'],   difficulty: 'Intermediate' },
  
  // Tips with full content
  { id: 't1', source: 'static', type: 'tip', category: 'tips-guides',     title: '5 Signs Your Crop Needs Urgent Attention',          description: 'Yellowing leaves, wilting at noon, unusual spots, stunted growth, and pest trails — act before it is too late.',                        
    content: "💡 5 SIGNS YOUR CROP NEEDS URGENT ATTENTION\n\n1️⃣ YELLOWING LEAVES\n→ Could be nitrogen deficiency or overwatering\n→ Check: Older leaves yellow = nitrogen; All yellow = overwatering\n\n2️⃣ WILTING AT NOON\n→ Root problem or water stress\n→ Check: If soil is moist, suspect root rot or disease\n\n3️⃣ UNUSUAL SPOTS ON LEAVES\n→ Fungal or bacterial infection\n→ Check: Brown spots with yellow halo = fungal; water-soaked = bacterial\n\n4️⃣ STUNTED GROWTH\n→ Nutrient deficiency or root damage\n→ Check: Small yellow leaves = deficiency; wilted = root problem\n\n5️⃣ PEST TRAILS OR INSECTS\n→ Active infestation\n→ Check: Webbing = spider mites; holes = caterpillars; sticky honeydew = aphids\n\n⚡ ACT FAST: Early detection = 80% chance of saving crop!", readTime: '2 min read', tags: ['Early Warning', 'Quick Tips'],           difficulty: 'Beginner' },
  { id: 't2', source: 'static', type: 'tip', category: 'tips-guides',     title: 'Best Times of Day to Apply Pesticides',             description: 'Spraying in early morning or late afternoon reduces evaporation loss, protects bees, and ensures 3× better absorption.',            
    content: "💡 BEST TIMES TO APPLY PESTICIDES\n\n🌅 EARLY MORNING (6-9 AM)\n✅ Best for most crops\n✅ Bees less active = safer for pollinators\n✅ Cool temperatures = less evaporation\n✅ Dew helps spray stick to leaves\n⚠️ Wait until dew dries in humid areas\n\n🌆 LATE AFTERNOON (4-7 PM)\n✅ Good alternative to morning\n✅ Lower UV degradation\n✅ Extended wet period for absorption\n✅ Less drift in calm air\n\n⛔ AVOID:\n• Midday (12-3 PM): 50% evaporation loss\n• Windy conditions: uneven application\n• Rainy days: wash off effectiveness\n\n💡 PRO TIPS:\n• Check weather forecast - no rain for 4 hours\n• Add sticker spreader for better adhesion\n• Cover all leaf surfaces, especially undersides", readTime: '2 min read', tags: ['Spraying', 'Timing', 'Effectiveness'],   difficulty: 'Beginner' },
  { id: 't3', source: 'static', type: 'tip', category: 'tips-guides',     title: 'How to Test Your Soil pH at Home',                  description: 'Using inexpensive pH strips or turmeric powder to check soil acidity and decide if lime or sulphur is needed.',                     
    content: "💡 HOW TO TEST SOIL pH AT HOME\n\nMETHOD 1: pH STRIP TEST\n1. Mix 2 tbsp soil with 1 cup water\n2. Let settle for 30 minutes\n3. Dip pH strip in clear liquid\n4. Compare color chart:\n   • pH 4-5: Very acidic → Add lime\n   • pH 5-6: Acidic → Add lime\n   • pH 6-7: Ideal → No change needed\n   • pH 7-8: Alkaline → Add sulfur\n   • pH 8+: Very alkaline → Add sulfur\n\nMETHOD 2: TURMERIC TEST\n1. Mix 1 tbsp soil with 1 tsp turmeric powder\n2. Add water to make paste\n3. Let dry in sunlight\n4. If turns pink = alkaline (add sulfur)\n   If stays yellow = acidic (add lime)\n\n💡 CORRECTION RATES:\n• Lime: 200-300 kg/bigha for pH < 5\n• Sulfur: 50-100 kg/bigha for pH > 8\n• Re-test after 2 weeks", readTime: '3 min read', tags: ['Soil Test', 'pH', 'DIY'],                difficulty: 'Beginner' },
  { id: 't4', source: 'static', type: 'tip', category: 'cost-reduction',  title: 'Seed Selection: Save Seeds for Next Season',        description: 'Save up to ৳3,000 per bigha by selecting and storing the best seeds from your current harvest for next season.',                   
    content: "💡 SEED SELECTION & STORAGE\n\n🌾 SELECT BEST SEEDS:\n• Choose from healthy, productive plants\n• Select full, plump grains from main panicles\n• Avoid seeds from diseased or weak plants\n• Pick from the center of the field (less cross-pollination)\n\n💧 PROPER DRYING:\n• Sun dry for 3-4 days\n• Moisture content should be 12-14%\n• Test: Bite - should crack, not squash\n\n📦 STORAGE TIPS:\n• Use airtight containers (plastic jars, bags)\n• Add neem leaves to repel insects\n• Store in cool, dry, dark place\n• Add silica gel packets to absorb moisture\n• Check monthly for pests\n\n💰 COST SAVINGS:\n• Rice: Save ৳2,000-3,000/bigha\n• Wheat: Save ৳1,500-2,000/bigha\n• Vegetables: Save ৳500-1,000/bigha\n• Replaces buying new seeds every season!", readTime: '3 min read', tags: ['Seeds', 'Savings', 'Storage'],           difficulty: 'Beginner' },
  { id: 't5', source: 'static', type: 'tip', category: 'extreme-weather', title: 'Emergency Actions When Hailstorm Hits Your Crops', description: 'Immediate steps in the 24 hours after a hailstorm: assess damage, apply fungicide, and document for insurance.',                     
    content: "💡 HAILSTORM EMERGENCY ACTIONS\n\n⏰ FIRST 24 HOURS:\n\n1. ASSESS DAMAGE\n• Check crop stage - vegetative vs flowering\n• Estimate % damage to leaves, stems, fruits\n• Take photos from multiple angles\n\n2. REMOVE DEBRIS\n• Clear broken branches, damaged leaves\n• Remove fallen fruits and vegetables\n• Prevent disease spread from rotting material\n\n3. APPLY FUNGICIDE\n• Mancozeb or Copper oxychloride\n• Prevents fungal infection on damaged tissue\n• Spray within 24 hours\n\n4. NUTRIENT SUPPORT\n• Spray urea (2%) or foliar fertilizer\n• Helps plants recover faster\n• Apply after 3-4 days if plants stabilize\n\n5. DOCUMENT FOR INSURANCE\n• Date-stamped photos\n• Written damage estimate\n• Contact insurance within 72 hours\n\n🌱 RECOVERY:\n• Most crops recover in 2-3 weeks\n• Extra irrigation to reduce stress\n• Avoid heavy pruning - let plants heal", readTime: '3 min read', tags: ['Hailstorm', 'Emergency', 'Recovery'],    difficulty: 'Intermediate' },
];

// ── Config ────────────────────────────────────────────────────────────────────
const categories: { id: Category; label: string; icon: string; color: string }[] = [
  { id: 'all',             label: 'All Content',     icon: '📚', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { id: 'crop-care',       label: 'Crop Care',        icon: '🌱', color: 'bg-green-100 text-green-800 border-green-300' },
  { id: 'fertilizer',     label: 'Fertilizer',       icon: '🧪', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'pesticides',     label: 'Pesticides',       icon: '🐛', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'cost-reduction', label: 'Cost Reduction',   icon: '💰', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'extreme-weather',label: 'Extreme Weather',  icon: '🌧️', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'tips-guides',    label: 'Tips & Guides',    icon: '💡', color: 'bg-amber-100 text-amber-800 border-amber-300' },
];

const typeConfig: Record<ContentType, { icon: string; label: string; bg: string }> = {
  video:       { icon: '▶️', label: 'Video',       bg: 'bg-red-50 border-red-200 text-red-700' },
  infographic: { icon: '📊', label: 'Infographic', bg: 'bg-purple-50 border-purple-200 text-purple-700' },
  guide:       { icon: '📖', label: 'Guide',       bg: 'bg-blue-50 border-blue-200 text-blue-700' },
  tip:         { icon: '💡', label: 'Quick Tip',   bg: 'bg-amber-50 border-amber-200 text-amber-700' },
};

const difficultyConfig: Record<string, string> = {
  Beginner:     'bg-green-100 text-green-800',
  Intermediate: 'bg-yellow-100 text-yellow-800',
  Advanced:     'bg-red-100 text-red-800',
};

const infographicColors: Record<string, string> = {
  i1: 'from-blue-400 to-indigo-600', i2: 'from-orange-400 to-red-500',
  i3: 'from-emerald-400 to-teal-600', i4: 'from-slate-400 to-indigo-700', i5: 'from-yellow-400 to-amber-600',
};
const infographicEmojis: Record<string, string> = { i1: '📅', i2: '🐛', i3: '🌍', i4: '🌀', i5: '💸' };

// ── Flag Modal ─────────────────────────────────────────────────────────────────
function FlagModal({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit() {
    if (!reason.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/learning-content/${itemId}/flag`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    setLoading(false);
    if (res.ok) setTimeout(onClose, 2000);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900">🚩 Report Content</h3>
        <p className="text-sm text-gray-500">Help us maintain quality. Let us know why this content is problematic.</p>
        <select value={reason} onChange={e => setReason(e.target.value)} className="input text-sm">
          <option value="">Select a reason...</option>
          <option value="Inaccurate or harmful farming advice">Inaccurate or harmful farming advice</option>
          <option value="Spam or irrelevant content">Spam or irrelevant content</option>
          <option value="Offensive or inappropriate">Offensive or inappropriate</option>
          <option value="Duplicate content">Duplicate content</option>
          <option value="Other">Other</option>
        </select>
        {msg && <p className="text-sm text-green-700 font-medium">{msg}</p>}
        <div className="flex gap-2">
          <button onClick={submit} disabled={!reason || loading} className="btn-primary flex-1 py-2 text-sm disabled:opacity-60">
            {loading ? 'Reporting...' : 'Submit Report'}
          </button>
          <button onClick={onClose} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Content Detail Modal ───────────────────────────────────────────────────────
function ContentModal({ item, onClose, onFlag }: { item: LearningItem; onClose: () => void; onFlag: (id: string) => void }) {
  const isFlaggable = item.source === 'dynamic';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {item.type === 'video' && item.youtubeId && (
          <div className="relative bg-black aspect-video">
            <iframe src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`} title={item.title} allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full" />
          </div>
        )}

        {item.type === 'infographic' && (item.imageUrl || item.source === 'static') && (
          <div className={`relative h-48 flex items-center justify-center ${item.imageUrl ? '' : `bg-gradient-to-br ${infographicColors[item.id] || 'from-purple-400 to-indigo-600'}`}`}>
            {item.imageUrl
              ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain" />
              : <span className="text-6xl">{infographicEmojis[item.id] || '📊'}</span>
            }
          </div>
        )}

        {/* Guide / Tip content - show for all static items and dynamic items with content */}
        {(item.type === 'guide' || item.type === 'tip' || item.type === 'infographic') && item.content && (
          <div className="bg-gray-50 rounded-2xl p-4 mx-6 mt-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
            {item.content}
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Author badge for community content */}
          {item.source === 'dynamic' && item.authorName && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
              item.authorRole === 'specialist' ? 'bg-blue-100 text-blue-800' :
              item.authorRole === 'admin' ? 'bg-purple-100 text-purple-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {item.authorRole === 'specialist' ? '🔬 Expert' : item.authorRole === 'admin' ? '👑 Admin' : '🌾 Farmer Contributed'}
              <span>· by {item.authorName}</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
            <button onClick={onClose} className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition">✕</button>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>

          {/* Guide / Tip content */}
          {(item.type === 'guide' || item.type === 'tip') && item.content && (
            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {item.content}
            </div>
          )}

          {/* Infographic with imageUrl */}
          {item.type === 'infographic' && item.imageUrl && (
            <img src={item.imageUrl} alt={item.title} className="w-full rounded-2xl border border-gray-200 object-contain max-h-[400px]" />
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {item.tags.map(t => <span key={t} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">{t}</span>)}
            </div>
            {isFlaggable && (
              <button onClick={() => { onClose(); onFlag(item.id); }} className="text-xs text-gray-400 hover:text-red-500 transition font-medium flex items-center gap-1">
                🚩 Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Content Card ──────────────────────────────────────────────────────────────
function ContentCard({ item, onOpen }: { item: LearningItem; onOpen: (item: LearningItem) => void }) {
  const tc      = typeConfig[item.type];
  const catCfg  = categories.find(c => c.id === item.category);
  const isCommunity = item.source === 'dynamic';

  return (
    <article onClick={() => onOpen(item)} className="group rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1 relative">
      {/* Community badge */}
      {isCommunity && (
        <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-xs font-bold ${
          item.authorRole === 'specialist' ? 'bg-blue-600 text-white' :
          item.authorRole === 'admin' ? 'bg-purple-600 text-white' :
          'bg-amber-500 text-white'
        }`}>
          {item.authorRole === 'specialist' ? '🔬 Expert' : item.authorRole === 'admin' ? '👑 Admin' : '🌾 Community'}
        </div>
      )}

      {/* Thumbnail */}
      {item.type === 'video' && item.youtubeId && (
        <div className="relative aspect-video bg-gray-900 overflow-hidden">
          <img src={`https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" onError={e => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`; }} />
          <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-red-600 text-xl ml-1">▶</span>
            </div>
          </div>
          {item.duration && <span className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs font-bold px-2 py-1 rounded-lg">{item.duration}</span>}
        </div>
      )}
      {item.type === 'infographic' && (
        <div className={`relative h-40 overflow-hidden flex items-center justify-center ${item.imageUrl ? 'bg-gray-100' : `bg-gradient-to-br ${infographicColors[item.id] || 'from-purple-400 to-indigo-600'}`}`}>
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <span className="text-6xl opacity-90 group-hover:scale-110 transition-transform duration-300">{infographicEmojis[item.id] || '📊'}</span>
          }
          <div className="absolute top-3 right-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-bold">Infographic</div>
        </div>
      )}
      {item.type === 'guide' && (
        <div className="h-32 bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
          <div className="text-center text-white"><div className="text-4xl mb-1">📖</div>{item.readTime && <div className="text-xs font-bold text-green-100">{item.readTime}</div>}</div>
        </div>
      )}
      {item.type === 'tip' && (
        <div className="h-24 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center gap-3">
          <span className="text-4xl">💡</span>
          <div className="text-white"><div className="text-xs font-bold uppercase tracking-wide text-amber-100">Quick Tip</div>{item.readTime && <div className="text-sm font-semibold">{item.readTime}</div>}</div>
        </div>
      )}

      {/* Body */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${tc.bg}`}>{tc.icon} {tc.label}</span>
          {catCfg && <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${catCfg.color}`}>{catCfg.icon} {catCfg.label}</span>}
        </div>
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-green-700 transition-colors">{item.title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1.5 flex-wrap">{item.tags.slice(0, 2).map(t => <span key={t} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">{t}</span>)}</div>
          {item.difficulty && <span className={`text-xs font-bold px-2 py-1 rounded-full ${difficultyConfig[item.difficulty]}`}>{item.difficulty}</span>}
        </div>
        {isCommunity && item.authorName && (
          <p className="text-xs text-gray-400 mt-2 font-medium">by {item.authorName}</p>
        )}
      </div>
    </article>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LearningHub() {
  const { data: session } = useSession();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [activeType, setActiveType]         = useState<ContentType | 'all'>('all');
  const [search, setSearch]                 = useState('');
  const [modalItem, setModalItem]           = useState<LearningItem | null>(null);
  const [flagTarget, setFlagTarget]         = useState<string | null>(null);
  const [dynamicItems, setDynamicItems]     = useState<LearningItem[]>([]);
  const [userBehavior, setUserBehavior]     = useState<UserBehavior | null>(null);
  const [recommendations, setRecommendations] = useState<{ items: LearningItem[]; personalized: boolean }>({ items: [], personalized: false });

  const role = session?.user?.role as string | undefined;
  const canSubmit = role && ['admin', 'specialist', 'farmer'].includes(role);

  useEffect(() => {
    fetch('/api/learning-content')
      .then(r => r.json())
      .then(data => {
        const items: LearningItem[] = (data.items ?? []).map((i: {
          _id: string; type: ContentType; category: Category; title: string;
          description: string; youtubeId?: string; imageUrl?: string; content?: string;
          duration?: string; readTime?: string; tags: string[]; difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
          authorName?: string; authorRole?: 'admin' | 'specialist' | 'farmer'; flagCount?: number;
        }) => ({
          id:         i._id,
          source:     'dynamic' as Source,
          type:       i.type,
          category:   i.category,
          title:      i.title,
          description: i.description,
          youtubeId:  i.youtubeId,
          imageUrl:   i.imageUrl,
          content:    i.content,
          duration:   i.duration,
          readTime:   i.readTime,
          tags:       i.tags,
          difficulty: i.difficulty,
          authorName: i.authorName,
          authorRole: i.authorRole,
          flagCount:  i.flagCount,
        }));
        setDynamicItems(items);
      })
      .catch(() => {});
  }, []);

  // Fetch user behavior signals when session is available
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/user/behavior')
      .then(r => r.json())
      .then(data => setUserBehavior(data))
      .catch(() => {});
  }, [session?.user?.id]);

  // Recompute recommendations whenever behavior data or dynamic items change
  useEffect(() => {
    const all = [...dynamicItems, ...staticItems];
    if (userBehavior?.hasData) {
      const scored = all
        .map(item => ({ item, score: scoreItem(item, userBehavior) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(x => x.item);
      if (scored.length > 0) {
        setRecommendations({ items: scored, personalized: true });
        return;
      }
    }
    // Fallback: show recent dynamic items + a few static items for logged-in users
    if (session?.user?.id) {
      setRecommendations({
        items: [...dynamicItems.slice(0, 2), ...staticItems.slice(0, 2)],
        personalized: false,
      });
    }
  }, [userBehavior, dynamicItems, session?.user?.id]);

  // Debounced search tracking (fire-and-forget)
  useEffect(() => {
    if (!session?.user?.id || search.trim().length < 3) return;
    const t = setTimeout(() => {
      fetch('/api/user/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'search', query: search.trim() }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [search, session?.user?.id]);

  function trackBehavior(payload: Record<string, unknown>) {
    if (!session?.user?.id) return;
    fetch('/api/user/behavior', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  // Optimistically update local behavior state so recommendations react immediately
  function applyBehaviorLocally(event: { type: 'view'; tags: string[] } | { type: 'category_click'; category: string }) {
    setUserBehavior(prev => {
      const base = prev ?? { interests: [], recentViewTags: [], recentCategories: [], recentSearches: [], hasData: false };
      if (event.type === 'view') {
        const newTags = [...new Set([...base.recentViewTags, ...event.tags.map(t => t.toLowerCase())])];
        return { ...base, recentViewTags: newTags, hasData: true };
      }
      const newCats = [...new Set([...base.recentCategories, event.category])].slice(-5);
      return { ...base, recentCategories: newCats, hasData: true };
    });
  }

  function handleOpen(item: LearningItem) {
    setModalItem(item);
    trackBehavior({ type: 'view', contentId: item.id, tags: item.tags });
    applyBehaviorLocally({ type: 'view', tags: item.tags });
  }

  const allItems = [...dynamicItems, ...staticItems];

  const filtered = allItems.filter(item => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchType     = activeType === 'all' || item.type === activeType;
    const q = search.toLowerCase().trim();
    const matchSearch   = !q || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.tags.some(t => t.toLowerCase().includes(q));
    return matchCategory && matchType && matchSearch;
  });

  const stats = {
    total:        allItems.length,
    videos:       allItems.filter(i => i.type === 'video').length,
    infographics: allItems.filter(i => i.type === 'infographic').length,
    guides:       allItems.filter(i => i.type === 'guide').length,
    tips:         allItems.filter(i => i.type === 'tip').length,
    community:    dynamicItems.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 py-10">
      {modalItem && <ContentModal item={modalItem} onClose={() => setModalItem(null)} onFlag={id => { setModalItem(null); setFlagTarget(id); }} />}
      {flagTarget && <FlagModal itemId={flagTarget} onClose={() => setFlagTarget(null)} />}

      <div className="max-w-7xl mx-auto px-4 space-y-10">

        {/* Hero */}
        <div className="text-center space-y-4">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-green-700">🎓 AgroHaat Learning Hub</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">Learn. Grow. Prosper.</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Videos, infographics, and practical guides on crop care, fertilizers, pesticides, cost-saving strategies, and managing crops during extreme weather.
          </p>
          {canSubmit && (
            <Link href="/learning-hub/submit" className="inline-flex items-center gap-2 btn-primary text-base py-3 px-6 mt-2">
              <span className="text-lg">+</span> Share Your Knowledge
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Total',        value: stats.total,        icon: '📚', color: 'bg-gray-50 border-gray-200' },
            { label: 'Videos',       value: stats.videos,       icon: '▶️', color: 'bg-red-50 border-red-200' },
            { label: 'Infographics', value: stats.infographics, icon: '📊', color: 'bg-purple-50 border-purple-200' },
            { label: 'Guides',       value: stats.guides,       icon: '📖', color: 'bg-blue-50 border-blue-200' },
            { label: 'Tips',         value: stats.tips,         icon: '💡', color: 'bg-amber-50 border-amber-200' },
            { label: 'Community',    value: stats.community,    icon: '🌾', color: 'bg-green-50 border-green-200' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border ${s.color} p-3 text-center`}>
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Community Banner */}
        {dynamicItems.length > 0 && (
          <div className="rounded-3xl bg-gradient-to-r from-amber-50 to-green-50 border-2 border-amber-200 p-5 flex items-center gap-4">
            <span className="text-3xl">🌾</span>
            <div>
              <p className="font-bold text-gray-900">Community-Contributed Content</p>
              <p className="text-sm text-gray-600">{dynamicItems.length} resource{dynamicItems.length !== 1 ? 's' : ''} shared by farmers and experts in the AgroHaat community.</p>
            </div>
          </div>
        )}

        {/* Personalized Recommendations */}
        {session && recommendations.items.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {recommendations.personalized ? '✨ Recommended For You' : '🌱 Start Exploring'}
              </h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                recommendations.personalized ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {recommendations.personalized ? 'Personalized' : 'Popular'}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.items.map(item => (
                <ContentCard key={`rec-${item.id}`} item={item} onOpen={handleOpen} />
              ))}
            </div>
            {recommendations.personalized && (
              <p className="text-xs text-gray-400 mt-3 text-center">Based on your interests and browsing activity</p>
            )}
          </section>
        )}

        {/* Search */}
        <div className="relative max-w-xl mx-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          <input type="text" placeholder="Search videos, guides, tips..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-12 py-4 text-base shadow-sm" />
          {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>}
        </div>

        {/* Filters */}
        <div>
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => { setActiveCategory(cat.id); if (cat.id !== 'all') { trackBehavior({ type: 'category_click', category: cat.id }); applyBehaviorLocally({ type: 'category_click', category: cat.id }); } }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all duration-200 ${activeCategory === cat.id ? 'bg-green-600 text-white border-green-700 shadow-lg scale-105' : `${cat.color} hover:shadow-md`}`}>
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeCategory === cat.id ? 'bg-white bg-opacity-30 text-white' : 'bg-white bg-opacity-60'}`}>
                  {allItems.filter(i => cat.id === 'all' || i.category === cat.id).length}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-center mt-3 flex-wrap">
            {(['all', 'video', 'infographic', 'guide', 'tip'] as const).map(t => (
              <button key={t} onClick={() => setActiveType(t)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeType === t ? 'bg-gray-800 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                {t === 'all' ? 'All Types' : `${typeConfig[t].icon} ${typeConfig[t].label}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">
            {filtered.length === allItems.length ? `Showing all ${allItems.length} resources` : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} found`}
          </p>
          {(activeCategory !== 'all' || activeType !== 'all' || search) && (
            <button onClick={() => { setActiveCategory('all'); setActiveType('all'); setSearch(''); }} className="text-sm text-green-600 hover:text-green-700 font-bold underline">Clear filters</button>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900">No results found</h3>
            <p className="text-gray-500 mt-2">Try a different search term or filter.</p>
            <button onClick={() => { setActiveCategory('all'); setActiveType('all'); setSearch(''); }} className="mt-4 btn-primary">Show All</button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(item => <ContentCard key={item.id} item={item} onOpen={handleOpen} />)}
          </div>
        )}

        {/* CTA */}
        <div className="grid gap-6 md:grid-cols-3 mt-4">
          <div className="rounded-3xl bg-gradient-to-br from-green-600 to-green-700 text-white p-7 shadow-lg">
            <h3 className="text-xl font-bold mb-2">🧑‍🌾 Have a Crop Problem?</h3>
            <p className="text-green-100 text-sm leading-relaxed mb-4">Upload photos of your affected crops and get advice from our specialists within 24 hours.</p>
            <Link href="/farmer/crop-help" className="inline-block bg-white text-green-700 hover:bg-green-50 font-bold px-5 py-2.5 rounded-xl text-sm transition shadow">Report a Crop Issue →</Link>
          </div>
          {canSubmit ? (
            <div className="rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white p-7 shadow-lg">
              <h3 className="text-xl font-bold mb-2">📤 Share Your Knowledge</h3>
              <p className="text-amber-100 text-sm leading-relaxed mb-4">Help fellow farmers by sharing a video, guide, infographic, or tip from your experience.</p>
              <Link href="/learning-hub/submit" className="inline-block bg-white text-orange-600 hover:bg-orange-50 font-bold px-5 py-2.5 rounded-xl text-sm transition shadow">Submit Content →</Link>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border-2 border-gray-100 p-7 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-2">💬 Chat with Specialists</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">Get real-time answers from agricultural extension officers and experienced farmers.</p>
              <Link href="/chat" className="inline-block btn-primary text-sm py-2.5">Open Chat →</Link>
            </div>
          )}
          <div className="rounded-3xl bg-white border-2 border-gray-100 p-7 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">💬 Chat with Specialists</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">Get real-time answers from agricultural extension officers and experienced farmers.</p>
            <Link href="/chat" className="inline-block btn-primary text-sm py-2.5">Open Chat →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
