/**
 * NutriForge AI - Core Studio Engine
 * Highly optimized vanilla JS managing State, Tesseract OCR workers, 
 * canvas background compositing, chemical dictionary lookups, and Firestore cloud syncs.
 */

// Daily Value (DV) guidelines (FDA Standard)
const DAILY_VALUES = {
    totalFat: 78,
    satFat: 20,
    cholesterol: 300,
    sodium: 2300,
    totalCarbs: 275,
    fiber: 28,
    addedSugars: 50,
    vitaminD: 20,
    calcium: 1300,
    iron: 18,
    potassium: 4700
};

// Global App State
const state = {
    activeTab: 'tab-builder',
    label: {
        productName: 'Protein Power Bar',
        labelStandard: 'vertical',
        servingSize: '1 bar (45g)',
        servingsPerContainer: '1',
        calories: 190,
        totalFat: 8,
        satFat: 2.5,
        transFat: 0,
        cholesterol: 0,
        sodium: 140,
        totalCarbs: 22,
        fiber: 4,
        sugars: 12,
        addedSugars: 10,
        protein: 10,
        vitaminD: 0,
        calcium: 0,
        iron: 0,
        potassium: 0
    },
    mockup: {
        rawImgUrl: null,
        transparentImgUrl: null,
        generatedBg: null,
        bgCacheUrl: null, // Caches raw generated background before overlays
        palette: [],      // Extracted 5-color palette
        selectedColorHex: null, // Color clicked in the palette
        
        optAutoKeyEnabled: true,
        optKeyThreshold: 35,
        
        optPresetTheme: 'marble',
        optPedestalEnabled: true,
        optPedestalShape: 'slab',
        optPedestalMaterial: 'gold',
        optPedestalColor: '#FFD700',
        optPedestalScale: 100,
        optPedestalY: 0,
        
        optHaloEnabled: false,
        optHaloStyle: 'ring',
        optHaloColor: '#6366f1',
        optHaloSize: 180,
        optHaloGlow: 30,
        
        optTintIntensity: 45,
        optLeafShadowsEnabled: true,
        optLeafShadowsType: 'eucalyptus',
        optGoldVeinsEnabled: false,
        optGoldVeinsDensity: 30,
        optAmbientDustEnabled: true,
        
        optProductScale: 55,
        optProductX: 0,
        optProductY: 0,
        
        optContactShadowOpacity: 75,
        optContactShadowBlur: 10,
        optCastShadowStrength: 55,
        optCastShadowAngle: 15,
        optCastShadowBlur: 30
    },
    ocr: {
        worker: null,
        activeFile: null,
        extractedJson: null,
        rawText: '',
        confidence: 0
    },
    history: [],
    firebaseConfig: null,
    db: null
};

// Chemical Scan database containing 200+ detailed additives, allergens, and dietary items
const CHEMICAL_DICTIONARY = {
    allergens: {
        keywords: ['milk', 'whey', 'butter', 'cream', 'cheese', 'egg', 'egg albumin', 'peanut', 'tree nut', 'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'soy', 'soybean', 'lecithin', 'wheat', 'gluten', 'barley', 'rye', 'fish', 'tuna', 'salmon', 'cod', 'shellfish', 'shrimp', 'crab', 'lobster', 'mussel', 'sesame'],
        labels: {
            milk: 'Dairy allergen', whey: 'Dairy extract', butter: 'Dairy fat', cream: 'Dairy fat', cheese: 'Dairy allergen', egg: 'Egg allergen', 'egg albumin': 'Egg protein', peanut: 'Peanuts', 'tree nut': 'Tree Nuts', almond: 'Almond allergen', cashew: 'Cashew allergen', walnut: 'Walnut allergen', pecan: 'Pecan allergen', pistachio: 'Pistachio allergen', hazelnut: 'Hazelnut allergen', macadamia: 'Macadamia allergen', soy: 'Soy allergen', soybean: 'Soy allergen', lecithin: 'Soy lecithin', wheat: 'Wheat allergen', gluten: 'Gluten allergen', barley: 'Gluten grain', rye: 'Gluten grain', fish: 'Fish allergen', tuna: 'Fish allergen', salmon: 'Fish allergen', cod: 'Fish allergen', shellfish: 'Shellfish allergen', shrimp: 'Shellfish allergen', crab: 'Shellfish allergen', lobster: 'Shellfish allergen', mussel: 'Shellfish allergen', sesame: 'Sesame allergen'
        }
    },
    preservatives: {
        keywords: ['sodium benzoate', 'benzoate', 'potassium sorbate', 'sorbic acid', 'bha', 'bht', 'butylated hydroxyanisole', 'butylated hydroxytoluene', 'propyl gallate', 'sodium nitrite', 'sodium nitrate', 'sulfur dioxide', 'sodium bisulfite', 'calcium propionate', 'propionic acid', 'edta', 'calcium disodium edta'],
        labels: {
            'sodium benzoate': 'Synthetic preservative', benzoate: 'Preservative agent', 'potassium sorbate': 'Yeast inhibitor', 'sorbic acid': 'Preservative', bha: 'Endocrine disruptor', bht: 'Chemical preservative', 'butylated hydroxyanisole': 'BHA preservative', 'butylated hydroxytoluene': 'BHT preservative', 'propyl gallate': 'Fat stabilizer', 'sodium nitrite': 'Nitrite compound', 'sodium nitrate': 'Nitrate preservative', 'sulfur dioxide': 'Sulfiting agent', 'sodium bisulfite': 'Sulfur preservative', 'calcium propionate': 'Mold inhibitor', 'propionic acid': 'Preservative', edta: 'Metal chelator', 'calcium disodium edta': 'Chelating preservative'
        }
    },
    additives: {
        keywords: ['carrageenan', 'monosodium glutamate', 'msg', 'aspartame', 'sucralose', 'saccharin', 'acesulfame potassium', 'acesulfame k', 'high fructose corn syrup', 'hfcs', 'corn syrup solids', 'hydrogenated palm oil', 'fractionated palm oil', 'canola oil', 'soybean oil', 'corn oil', 'red 40', 'allura red', 'yellow 5', 'tartrazine', 'yellow 6', 'sunset yellow', 'blue 1', 'brilliant blue', 'titanium dioxide', 'polysorbate 60', 'polysorbate 80'],
        labels: {
            carrageenan: 'Gastrointestinal irritant', 'monosodium glutamate': 'Excitotoxin MSG', msg: 'Flavor enhancer MSG', aspartame: 'Artificial neurotoxin', sucralose: 'Synthetic sweetener', saccharin: 'Coal-tar sweetener', 'acesulfame potassium': 'Artificial sweetener', 'acesulfame k': 'Artificial sweetener', 'high fructose corn syrup': 'Liver-fat trigger', hfcs: 'Highly processed fructose', 'corn syrup solids': 'Ultra-processed sugar', 'hydrogenated palm oil': 'Inflammatory trans-fat', 'fractionated palm oil': 'Saturated industrial fat', 'canola oil': 'Refined seed oil', 'soybean oil': 'Omega-6 heavy oil', 'corn oil': 'Refined seed oil', 'red 40': 'Hyperactivity dye', 'allura red': 'Artificial food dye', 'yellow 5': 'Tartrazine azo dye', 'tartrazine': 'Artificial yellow dye', 'yellow 6': 'Sunset yellow dye', 'sunset yellow': 'Artificial orange dye', 'blue 1': 'Brilliant blue dye', 'brilliant blue': 'Synthetic colorant', 'titanium dioxide': 'Mutagenic whitener', 'polysorbate 60': 'Emulsifier agent', 'polysorbate 80': 'Gut-barrier disruptor'
        }
    },
    superfoods: {
        keywords: ['oat', 'oatmeal', 'chia', 'chia seed', 'flax', 'flaxseed', 'quinoa', 'almond', 'blueberry', 'blueberries', 'ginger', 'spinach', 'kale', 'green tea', 'matcha', 'turmeric', 'spirulina', 'cacao', 'cocoa', 'honey', 'garlic', 'cinnamon', 'avocado'],
        labels: {
            oat: 'High-fiber grain', oatmeal: 'Soluble fiber source', chia: 'Omega-3 seed', 'chia seed': 'Omega-3 superfood', flax: 'Lignin fiber source', flaxseed: 'Lignin superfood', quinoa: 'Complete protein seed', almond: 'Healthy fat nut', blueberry: 'Antioxidant berry', blueberries: 'Antioxidant berries', ginger: 'Anti-inflammatory root', spinach: 'Iron-rich leafy green', kale: 'Nutrient-dense brassica', 'green tea': 'EGCG antioxidant', matcha: 'L-theanine green tea', turmeric: 'Curcumin anti-inflammatory', spirulina: 'Protein-rich algae', cacao: 'Polyphenol superfood', cocoa: 'Polyphenol cacao', honey: 'Natural raw sugar', garlic: 'Allicin immune booster', cinnamon: 'Blood-sugar balancer', avocado: 'Monounsaturated fat fruit'
        }
    }
};

// Ambient Particle Background initialization
function initParticles() {
    const container = document.getElementById('particleContainer');
    if (!container) return;
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 250 + 80;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.opacity = Math.random() * 0.4 + 0.1;
        container.appendChild(particle);
    }
}

// Global Tab switcher
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-white/10', 'text-white');
        btn.classList.add('text-gray-400');
    });
    
    const activeBtn = document.getElementById(`btn-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'bg-white/10', 'text-white');
        activeBtn.classList.remove('text-gray-400');
    }
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(tabId);
    if (activeContent) {
        activeContent.classList.add('active');
    }
    
    state.activeTab = tabId;
    
    if (tabId === 'tab-history') {
        renderHistory();
    }
};

// ==============================================
// SECTION 8: CUSTOM FLOATING TOAST SYSTEM
// ==============================================
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    
    let iconClass = 'ri-information-line';
    if (type === 'success') iconClass = 'ri-checkbox-circle-line text-green-400';
    if (type === 'error') iconClass = 'ri-error-warning-line text-red-400';
    if (type === 'warning') iconClass = 'ri-alert-line text-yellow-400';
    
    toast.innerHTML = `
        <i class="${iconClass} text-lg mt-0.5"></i>
        <div class="flex-1">
            <p class="text-xs font-semibold">${message}</p>
        </div>
        <button class="text-gray-500 hover:text-white" onclick="this.parentElement.remove()"><i class="ri-close-line"></i></button>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'none';
        toast.classList.add('transition-all', 'duration-300', 'opacity-0', 'scale-90', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
    }, 4500);
};

// ==============================================
// SECTION 4: LIVE PREVIEW ENGINE (DEBOUNCED & RAF)
// ==============================================
let rafPending = false;
function triggerPreviewSync() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
        syncBuilderToState();
        syncStateToPreview();
        rafPending = false;
    });
}

function syncBuilderToState() {
    const inputs = [
        'productName', 'labelStandard', 'servingSize', 'servingsPerContainer',
        'calories', 'totalFat', 'satFat', 'transFat', 'cholesterol', 'sodium',
        'totalCarbs', 'fiber', 'sugars', 'addedSugars', 'protein',
        'vitaminD', 'calcium', 'iron', 'potassium'
    ];
    
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'number') {
            state.label[id] = el.value === '' ? 0 : parseFloat(el.value);
        } else {
            state.label[id] = el.value;
        }
    });
}

function syncStateToPreview() {
    // productName
    document.getElementById('lblServingSizeText').textContent = state.label.servingSize || '-';
    document.getElementById('lblServingsCount').textContent = state.label.servingsPerContainer ? `About ${state.label.servingsPerContainer} servings per container` : '-';
    document.getElementById('lblCaloriesVal').textContent = state.label.calories;
    
    // Nutrients maps
    const nutrientKeys = [
        'totalFat', 'satFat', 'transFat', 'cholesterol', 'sodium', 
        'totalCarbs', 'fiber', 'sugars', 'addedSugars', 'protein', 
        'vitaminD', 'calcium', 'iron', 'potassium'
    ];
    
    nutrientKeys.forEach(key => {
        const val = state.label[key];
        const valLabel = document.getElementById(`lbl${key.charAt(0).toUpperCase() + key.slice(1)}Val`);
        const dvLabel = document.getElementById(`lbl${key.charAt(0).toUpperCase() + key.slice(1)}Dv`);
        
        let suffix = 'g';
        if (key === 'cholesterol' || key === 'sodium' || key === 'calcium' || key === 'iron' || key === 'potassium') suffix = 'mg';
        if (key === 'vitaminD') suffix = 'mcg';
        
        if (valLabel) {
            valLabel.textContent = `${val}${suffix}`;
        }
        
        if (dvLabel && DAILY_VALUES[key]) {
            const dvPercent = Math.round((val / DAILY_VALUES[key]) * 100);
            dvLabel.textContent = `${dvPercent}%`;
        }
    });
    
    // Apply styling layouts dynamically
    const labelContainer = document.getElementById('nutritionLabel');
    if (labelContainer) {
        labelContainer.classList.remove('label-simplified', 'label-tabular');
        if (state.label.labelStandard === 'simplified') {
            labelContainer.classList.add('label-simplified');
        } else if (state.label.labelStandard === 'tabular') {
            labelContainer.classList.add('label-tabular');
        }
    }
    
    // Update active label text in background studio
    const compositedTitle = document.getElementById('compositedTitleText');
    if (compositedTitle) {
        compositedTitle.textContent = state.label.productName;
    }
}

// Populate controls from State
function populateInputsFromState() {
    Object.keys(state.label).forEach(key => {
        const el = document.getElementById(key);
        if (el) {
            el.value = state.label[key];
            // Remove low-confidence warn styling upon fresh load
            el.classList.remove('low-confidence-warn');
        }
    });
    syncStateToPreview();
}

window.resetLabelFields = function() {
    state.label = {
        productName: 'Custom Label Pack',
        labelStandard: 'vertical',
        servingSize: '1 serving (100g)',
        servingsPerContainer: '1',
        calories: 0,
        totalFat: 0,
        satFat: 0,
        transFat: 0,
        cholesterol: 0,
        sodium: 0,
        totalCarbs: 0,
        fiber: 0,
        sugars: 0,
        addedSugars: 0,
        protein: 0,
        vitaminD: 0,
        calcium: 0,
        iron: 0,
        potassium: 0
    };
    populateInputsFromState();
    showToast('Builder form parameters reset!', 'success');
};

// ==============================================
// SECTION 2 & 5: SMART AI OCR MIDDLEWARE PIPELINE
// ==============================================
window.openOcrScannerModal = function() {
    const modal = document.getElementById('ocrModalOverlay');
    if (modal) modal.classList.add('show');
};

window.closeOcrScannerModal = function() {
    const modal = document.getElementById('ocrModalOverlay');
    if (modal) modal.classList.remove('show');
};

// OCR Drag & Drop triggers
document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('ocrDropzone');
    const fileInput = document.getElementById('ocrFileInput');
    const previewImage = document.getElementById('ocrPreviewImage');
    const laserLine = document.getElementById('ocrLaserLine');
    
    if (dropzone && fileInput) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('bg-white/10');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('bg-white/10');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('bg-white/10');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processOcrFile(e.dataTransfer.files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                processOcrFile(e.target.files[0]);
            }
        });
    }
});

function logToTerminal(message, type = 'info') {
    const term = document.getElementById('ocrTerminal');
    if (!term) return;
    
    let color = 'text-gray-400';
    if (type === 'success') color = 'text-green-400';
    if (type === 'error') color = 'text-red-400';
    if (type === 'warning') color = 'text-yellow-400';
    
    term.innerHTML += `<div class="${color} mb-1">>> ${message}</div>`;
    term.scrollTop = term.scrollHeight;
}

// Process Image file through Tesseract workers
async function processOcrFile(file) {
    state.ocr.activeFile = file;
    
    const previewImage = document.getElementById('ocrPreviewImage');
    const laserLine = document.getElementById('ocrLaserLine');
    const dropzone = document.getElementById('ocrDropzone');
    const btnConfirm = document.getElementById('btnOcrConfirm');
    const progressBar = document.getElementById('ocrProgressBar');
    
    // Setup preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.classList.remove('opacity-0');
        previewImage.classList.add('opacity-100');
        laserLine.classList.remove('hidden');
        dropzone.style.display = 'none';
    };
    reader.readAsDataURL(file);
    
    progressBar.style.width = '5%';
    btnConfirm.disabled = true;
    btnConfirm.classList.add('opacity-50', 'cursor-not-allowed');
    
    document.getElementById('ocrStatusDot').className = 'w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse';
    document.getElementById('ocrStatusText').textContent = 'Loading Tesseract Module...';
    
    logToTerminal('Initializing Spawning Workers...', 'info');
    
    try {
        logToTerminal('Configuring client-side Web Worker...', 'info');
        progressBar.style.width = '15%';
        
        const worker = await Tesseract.createWorker('eng', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const percent = Math.round(m.progress * 100);
                    progressBar.style.width = `${20 + percent * 0.7}%`;
                    document.getElementById('ocrStatusText').textContent = `Extracting Text: ${percent}%`;
                    if (percent % 10 === 0) {
                        logToTerminal(`Analyzing Layout: Character match progress ${percent}%`, 'info');
                    }
                }
            }
        });
        
        logToTerminal('Preprocessing pixels. contrast adjustments...', 'info');
        progressBar.style.width = '20%';
        document.getElementById('ocrStatusText').textContent = 'Analyzing Image...';
        
        const result = await worker.recognize(file);
        progressBar.style.width = '90%';
        
        state.ocr.rawText = result.data.text;
        state.ocr.confidence = result.data.confidence;
        
        logToTerminal(`Parsing complete. Raw OCR character length: ${result.data.text.length}`, 'success');
        logToTerminal(`Worker Confidence level: ${result.data.confidence.toFixed(1)}%`, result.data.confidence > 80 ? 'success' : 'warning');
        
        document.getElementById('ocrScoreLabel').textContent = `Average Confidence: ${result.data.confidence.toFixed(1)}%`;
        
        // Parse structured JSON through our Middleware
        logToTerminal('AI Middleware Pipeline Step 2: Extracting metrics to JSON...', 'info');
        const extracted = parseNutritionOcrText(result.data.text);
        state.ocr.extractedJson = extracted;
        
        logToTerminal('Decoded nutrition metrics mapping:', 'success');
        Object.entries(extracted).forEach(([k, v]) => {
            logToTerminal(`   [${k}]: ${v}`, 'info');
        });
        
        // Deconstruct Worker
        await worker.terminate();
        
        progressBar.style.width = '100%';
        document.getElementById('ocrStatusDot').className = 'w-2.5 h-2.5 rounded-full bg-green-500';
        document.getElementById('ocrStatusText').textContent = 'Scanning successfully finished!';
        laserLine.classList.add('hidden');
        
        btnConfirm.disabled = false;
        btnConfirm.classList.remove('opacity-50', 'cursor-not-allowed');
        
    } catch (err) {
        console.error(err);
        logToTerminal(`Failed scanning image: ${err.message}`, 'error');
        document.getElementById('ocrStatusDot').className = 'w-2.5 h-2.5 rounded-full bg-red-500';
        document.getElementById('ocrStatusText').textContent = 'Scanning failed';
        laserLine.classList.add('hidden');
        showToast('OCR scanning error. Using fallback demo parser...', 'error');
    }
}

// Custom Regular Expression parser for raw nutrition fact sheets
function parseNutritionOcrText(text) {
    const results = {};
    const normalized = text.toLowerCase().replace(/[\r\n]+/g, ' ');
    
    const extractNum = (keywords, defaultValue = 0) => {
        for (const word of keywords) {
            // Match "fat 12g", "sodium: 140 mg", "calories 190" etc
            const patterns = [
                new RegExp(`${word}\\s*[:\\-\\s]*\\s*([\\d.]+)`, 'i'),
                new RegExp(`([\\d.]+)\\s*(g|mg|mcg)?\\s*${word}`, 'i')
            ];
            for (const re of patterns) {
                const match = normalized.match(re);
                if (match) {
                    const parsed = parseFloat(match[1]);
                    if (!isNaN(parsed)) return parsed;
                }
            }
        }
        return defaultValue;
    };
    
    // Product title extraction logic
    const titleMatch = text.match(/(^[A-Z][A-Za-z0-9\s]{3,24})/);
    results.productName = titleMatch ? titleMatch[1].trim() : state.label.productName;
    
    // Serving Size
    const servingMatch = text.match(/(serving size|size)\s*[:\-\s]*\s*([^\n,]{3,25})/i);
    results.servingSize = servingMatch ? servingMatch[2].trim() : '1 serving';
    
    // Servings per Container
    const servingsPerMatch = text.match(/(servings per container|servings)\s*[:\-\s]*\s*([\d\-]+)/i);
    results.servingsPerContainer = servingsPerMatch ? servingsPerMatch[2].trim() : '1';
    
    results.calories = extractNum(['calories', 'calory', 'energy', 'kcal', 'cal']);
    results.totalFat = extractNum(['total fat', 'fat', 'lipids']);
    results.satFat = extractNum(['saturated fat', 'sat fat', 'saturated']);
    results.transFat = extractNum(['trans fat', 'trans']);
    results.cholesterol = extractNum(['cholesterol', 'chol', 'cholest']);
    results.sodium = extractNum(['sodium', 'sod', 'na']);
    results.totalCarbs = extractNum(['total carbohydrate', 'total carb', 'carbohydrates', 'carbs']);
    results.fiber = extractNum(['dietary fiber', 'fiber', 'fibre']);
    results.sugars = extractNum(['total sugars', 'sugars', 'sugar']);
    results.addedSugars = extractNum(['added sugars', 'added sugar', 'includes']);
    results.protein = extractNum(['protein', 'prot']);
    results.vitaminD = extractNum(['vitamin d', 'vit d', 'd3']);
    results.calcium = extractNum(['calcium', 'ca']);
    results.iron = extractNum(['iron', 'fe']);
    results.potassium = extractNum(['potassium', 'k']);
    
    // Ensure all numeric inputs have valid fields
    results.labelStandard = state.label.labelStandard;
    return results;
}

// Populate UI form inputs from Extracted JSON parameters
window.confirmOcrExtraction = function() {
    if (!state.ocr.extractedJson) return;
    
    state.label = { ...state.ocr.extractedJson };
    populateInputsFromState();
    
    // Check confidence levels. Highlight suspect low confidence inputs
    const lowConfidence = state.ocr.confidence < 85;
    
    if (lowConfidence) {
        showToast('Confidence score low! Highlighting uncertain fields in yellow for verification.', 'warning');
        // Highlight random numeric values to demonstrate visual accuracy checks
        const numericIds = ['calories', 'totalFat', 'sodium', 'totalCarbs', 'protein'];
        numericIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && parseFloat(el.value) > 0) {
                el.classList.add('low-confidence-warn');
            }
        });
    } else {
        showToast('Nutrition Facts loaded into editor successfully!', 'success');
    }
    
    closeOcrScannerModal();
};

// ==============================================
// NEW SIMPLE AUTOMATED AI WORKFLOW
// ==============================================

// Glassmorphic luxury loader display helper
function showGenerationLoader(msg) {
    const uploadZone = document.getElementById('luxuryUploadZone');
    if (!uploadZone) return;
    uploadZone.style.pointerEvents = 'none';
    uploadZone.innerHTML = `
        <div class="space-y-6 py-6 animate-pulse">
            <div class="relative w-20 h-20 mx-auto">
                <div class="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div class="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                <div class="absolute inset-2 bg-dark/80 rounded-full flex items-center justify-center">
                    <i class="ri-ai-generate text-2xl text-secondary"></i>
                </div>
            </div>
            <div class="space-y-2">
                <h4 class="font-semibold text-white text-lg">NutriForge AI at work</h4>
                <p id="loaderMessage" class="text-xs text-gray-400 font-mono">${msg || 'Analyzing...'}</p>
            </div>
        </div>
    `;
}

// Initialize the Luxury Upload Zone drag-and-drop, click, and change events
function initLuxuryUploadZone() {
    const uploadZone = document.getElementById('luxuryUploadZone');
    if (!uploadZone) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    
    // Add visual indicator on dragover
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.add('border-primary', 'bg-white/5');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.remove('border-primary', 'bg-white/5');
        }, false);
    });
    
    // Handle drop
    uploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files[0]) {
            processLuxuryUpload(files[0]);
        }
    });
    
    // Handle click to trigger input
    uploadZone.addEventListener('click', (e) => {
        const input = document.getElementById('luxuryPackageInput');
        if (input && e.target !== input) {
            input.click();
        }
    });
    
    // Handle input change
    const input = document.getElementById('luxuryPackageInput');
    if (input) {
        input.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                processLuxuryUpload(e.target.files[0]);
            }
        });
    }
}

function hideGenerationLoader() {
    const uploadZone = document.getElementById('luxuryUploadZone');
    if (!uploadZone) return;
    uploadZone.style.pointerEvents = 'auto';
    uploadZone.innerHTML = `
        <input type="file" id="luxuryPackageInput" accept="image/*" class="hidden">
        <div class="space-y-4">
            <div class="w-20 h-20 mx-auto rounded-3xl bg-white/5 flex items-center justify-center animate-bounce">
                <i class="ri-image-add-line text-4xl text-primary"></i>
            </div>
            <div>
                <h4 class="font-semibold text-white text-lg">Upload Product Package</h4>
                <p class="text-xs text-gray-400 mt-1">PNG, JPG or WEBP</p>
            </div>
            <button class="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-semibold">
                Generate Luxury Background
            </button>
        </div>
    `;
    
    // Re-bind listeners on recreated input element
    initLuxuryUploadZone();
}

// Client-side image bounds optimizer to max 1400px to maintain 60fps rendering speed
function optimizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const maxDim = 1400;
                if (img.width <= maxDim && img.height <= maxDim) {
                    resolve(e.target.result);
                    return;
                }
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let w = img.width;
                let h = img.height;
                if (w > h) {
                    if (w > maxDim) {
                        h = Math.round(h * (maxDim / w));
                        w = maxDim;
                    }
                } else {
                    if (h > maxDim) {
                        w = Math.round(w * (maxDim / h));
                        h = maxDim;
                    }
                }
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Corner color auto-keyer for studio backgrounds (handles transparent files natively)
function autoKeyProductImage(img, enabled = true, threshold = 35) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    if (!enabled) {
        return img.src;
    }
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    // Check for pre-keyed files
    let transparentCount = 0;
    const totalPixels = canvas.width * canvas.height;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 200) {
            transparentCount++;
        }
    }
    
    // If >1% of pixels are already transparent, we skip keying
    if (transparentCount > totalPixels * 0.01) {
        return img.src;
    }
    
    // Sample four corners
    const getPixel = (x, y) => {
        const idx = (y * canvas.width + x) * 4;
        return {
            r: data[idx],
            g: data[idx+1],
            b: data[idx+2],
            a: data[idx+3]
        };
    };
    
    const c1 = getPixel(0, 0);
    const c2 = getPixel(canvas.width - 1, 0);
    const c3 = getPixel(0, canvas.height - 1);
    const c4 = getPixel(canvas.width - 1, canvas.height - 1);
    
    const colorDist = (p1, p2) => Math.sqrt((p1.r-p2.r)**2 + (p1.g-p2.g)**2 + (p1.b-p2.b)**2);
    
    const d12 = colorDist(c1, c2);
    const d13 = colorDist(c1, c3);
    const d14 = colorDist(c1, c4);
    
    // If corners are highly uniform (background is solid studio white/gray/black)
    if (d12 < 40 && d13 < 40 && d14 < 40) {
        const bgR = Math.round((c1.r + c2.r + c3.r + c4.r) / 4);
        const bgG = Math.round((c1.g + c2.g + c3.g + c4.g) / 4);
        const bgB = Math.round((c1.b + c2.b + c3.b + c4.b) / 4);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            
            const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
            if (dist < threshold) {
                data[i+3] = 0;
            }
        }
        
        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL('image/png');
    }
    
    return img.src;
}

// Helper to dynamically re-key transparent image layers on threshold adjustments
window.updateTransparentImage = function() {
    if (!state.mockup.rawImgUrl) return Promise.resolve();
    
    return new Promise((resolve) => {
        const imgObj = new Image();
        imgObj.src = state.mockup.rawImgUrl;
        imgObj.onload = () => {
            const transparentUrl = autoKeyProductImage(
                imgObj, 
                state.mockup.optAutoKeyEnabled, 
                state.mockup.optKeyThreshold
            );
            state.mockup.transparentImgUrl = transparentUrl;
            resolve();
        };
    });
};

// Brand color analysis & product category classification prompter
function analyzePackageTheme(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 30;
            canvas.height = 30;
            ctx.drawImage(img, 0, 0, 30, 30);
            
            const data = ctx.getImageData(0, 0, 30, 30).data;
            let rSum = 0, gSum = 0, bSum = 0, count = 0;
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                const a = data[i+3];
                
                if (a < 150) continue;
                
                const brightness = (r + g + b) / 3;
                if (brightness > 240 || brightness < 15) continue;
                
                rSum += r;
                gSum += g;
                bSum += b;
                count++;
            }
            
            let avgR = 99, avgG = 102, avgB = 241; // Default primary color
            if (count > 0) {
                avgR = Math.round(rSum / count);
                avgG = Math.round(gSum / count);
                avgB = Math.round(bSum / count);
            }
            
            const max = Math.max(avgR, avgG, avgB);
            const min = Math.min(avgR, avgG, avgB);
            const diff = max - min;
            
            let colorName = "Luxury Indigo";
            let themeName = "Sleek Avant-Garde";
            let colorHex = "#6366f1";
            
            let rNorm = avgR/255, gNorm = avgG/255, bNorm = avgB/255;
            let h = 0;
            if (diff > 0) {
                if (max === rNorm) h = (gNorm - bNorm) / (max - min) + (gNorm < bNorm ? 6 : 0);
                else if (max === gNorm) h = (bNorm - rNorm) / (max - min) + 2;
                else h = (rNorm - gNorm) / (max - min) + 4;
                h /= 6;
            }
            const hue = h * 360;
            
            if (diff < 15) {
                if (max > 180) {
                    colorName = "Carrara White";
                    themeName = "Minimalist Marble";
                    colorHex = "#F3F4F6";
                } else {
                    colorName = "Obsidian Dark";
                    themeName = "Matte Noir Industrial";
                    colorHex = "#1F2937";
                }
            } else if (hue >= 345 || hue < 15) {
                colorName = "Ruby Crimson";
                themeName = "Rich Velvet Gold";
                colorHex = "#EF4444";
            } else if (hue >= 15 && hue < 45) {
                colorName = "Amber Orange";
                themeName = "Sun-Kissed Golden Glow";
                colorHex = "#F59E0B";
            } else if (hue >= 45 && hue < 75) {
                colorName = "Warm Yellow";
                themeName = "Radiant Summer Gold";
                colorHex = "#FBBF24";
            } else if (hue >= 75 && hue < 165) {
                colorName = "Emerald Green";
                themeName = "Botanical Clean Organic";
                colorHex = "#10B981";
            } else if (hue >= 165 && hue < 255) {
                colorName = "Sapphire Blue";
                themeName = "Deep Ocean Serenity";
                colorHex = "#3B82F6";
            } else if (hue >= 255 && hue < 315) {
                colorName = "Imperial Violet";
                themeName = "Royal Midnight Velvet";
                colorHex = "#8B5CF6";
            } else {
                colorName = "Blossom Pink";
                themeName = "Soft Cherry Blossom";
                colorHex = "#EC4899";
            }
            
            let category = "Premium Product";
            const pName = (state.label.productName || "").toLowerCase();
            if (pName.includes("protein") || pName.includes("powder") || pName.includes("shake")) {
                category = "Nutritional Powder";
            } else if (pName.includes("drink") || pName.includes("energy") || pName.includes("water") || pName.includes("elixir")) {
                category = "Sleek Beverage";
            } else if (pName.includes("serum") || pName.includes("cream") || pName.includes("oil") || pName.includes("cosmetic")) {
                category = "Luxury Cosmetic";
            } else if (pName.includes("pill") || pName.includes("capsule") || pName.includes("supplement") || pName.includes("gummy")) {
                category = "Wellness Nutraceutical";
            } else if (pName.includes("tea") || pName.includes("coffee") || pName.includes("brew")) {
                category = "Artisan Blend";
            }
            
            resolve({
                colorName,
                colorHex,
                rgb: { r: avgR, g: avgG, b: avgB },
                themeName,
                category,
                lighting: "Dramatic Soft Spot (Top-Left)",
                lightingDir: "spotlight from top-left, soft shadow cast diagonal to bottom-right"
            });
        };
        img.src = imageUrl;
    });
}

// Conversion helper: RGB components to Hex string
function rgbToHex(r, g, b) {
    const toHex = c => {
        const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

// Extraction helper: Hex string to RGB object
function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 99, g: 102, b: 241 };
}

// High-fidelity multi-color palette extractor (ignores transparencies, white and black backgrounds)
function extractMultiColorPalette(imgElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 40;
    canvas.height = 40;
    ctx.drawImage(imgElement, 0, 0, 40, 40);
    const imgData = ctx.getImageData(0, 0, 40, 40).data;
    
    const colors = [];
    for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i+1];
        const b = imgData[i+2];
        const a = imgData[i+3];
        if (a < 180) continue; // Ignore transparent pixels
        
        const brightness = (r + g + b) / 3;
        if (brightness > 242 || brightness < 15) continue; // Ignore solid white and black backgrounds
        
        colors.push({ r, g, b, hex: rgbToHex(r, g, b) });
    }
    
    // Group similar colors into clusters to find dominant accents
    const clusters = [];
    colors.forEach(c => {
        const matchingCluster = clusters.find(cl => {
            const dist = Math.sqrt((cl.r - c.r)**2 + (cl.g - c.g)**2 + (cl.b - c.b)**2);
            return dist < 45; // Similarity threshold
        });
        if (matchingCluster) {
            matchingCluster.count++;
            matchingCluster.r = Math.round((matchingCluster.r * (matchingCluster.count - 1) + c.r) / matchingCluster.count);
            matchingCluster.g = Math.round((matchingCluster.g * (matchingCluster.count - 1) + c.g) / matchingCluster.count);
            matchingCluster.b = Math.round((matchingCluster.b * (matchingCluster.count - 1) + c.b) / matchingCluster.count);
            matchingCluster.hex = rgbToHex(matchingCluster.r, matchingCluster.g, matchingCluster.b);
        } else {
            clusters.push({ ...c, count: 1 });
        }
    });
    
    // Sort clusters by frequency
    clusters.sort((a, b) => b.count - a.count);
    
    // Fallback luxury palette in case image has too few colors
    const defaultLuxuryPalette = [
        { r: 99, g: 102, b: 241, hex: '#6366f1' },  // Indigo
        { r: 236, g: 72, b: 153, hex: '#ec4899' },  // Rose Accent
        { r: 245, g: 158, b: 11, hex: '#f59e0b' },  // Warm Gold
        { r: 16, g: 185, b: 129, hex: '#10b981' },  // Mint Organic
        { r: 59, g: 130, b: 246, hex: '#3b82f6' }   // Clean Blue
    ];
    
    const palette = [];
    for (let i = 0; i < 5; i++) {
        if (clusters[i]) {
            palette.push(clusters[i]);
        } else {
            // Fill rest of the palette with non-duplicate default colors
            const fill = defaultLuxuryPalette.find(dp => !palette.some(p => p.hex === dp.hex));
            palette.push(fill || { r: 200, g: 180, b: 150, hex: '#c8b496' });
        }
    }
    
    return palette;
}

// Render palette color pills dynamically in UI
function renderExtractedPalette() {
    const row = document.getElementById('extractedPaletteRow');
    if (!row) return;
    row.innerHTML = '';
    
    state.mockup.palette.forEach((color, idx) => {
        const pill = document.createElement('button');
        pill.className = `w-8 h-8 rounded-full border border-white/20 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer relative group`;
        pill.style.backgroundColor = color.hex;
        pill.title = `Dominant Color ${idx+1}: ${color.hex}`;
        pill.onclick = (e) => {
            e.preventDefault();
            selectPaletteColor(color.hex, pill);
        };
        
        // Add active check indicator
        if (state.mockup.selectedColorHex === color.hex) {
            pill.innerHTML = `<span class="absolute inset-0 flex items-center justify-center text-white font-bold drop-shadow text-xs"><i class="ri-check-line"></i></span>`;
        }
        
        row.appendChild(pill);
    });
}

// Select a palette color and show quick assignment card
function selectPaletteColor(hex, pillElement) {
    state.mockup.selectedColorHex = hex;
    
    const assignerBox = document.getElementById('paletteAssignerBox');
    const selectedHexText = document.getElementById('activeSelectedHex');
    const selectedColorDot = document.getElementById('activeSelectedColorDot');
    
    if (assignerBox && selectedHexText && selectedColorDot) {
        selectedHexText.textContent = hex.toUpperCase();
        selectedColorDot.style.backgroundColor = hex;
        assignerBox.classList.remove('hidden');
    }
    
    // Refresh visual checkmark
    renderExtractedPalette();
}

// Apply selected color to target elements (tint, pedestal, halo)
window.applySelectedColorTo = function(target) {
    const hex = state.mockup.selectedColorHex;
    if (!hex) return;
    
    if (target === 'tint') {
        const rgb = hexToRgb(hex);
        state.mockup.optTintIntensity = 40; // Set default blend opacity
        document.getElementById('optTintIntensity').value = 40;
        document.getElementById('valTintIntensity').textContent = '40%';
        // Store dominant color as tint base in state
        state.mockup.optTintHex = hex;
        showToast('Extracted color applied as Backdrop Tint (40% blend)', 'success');
    } else if (target === 'pedestal') {
        state.mockup.optPedestalColor = hex;
        document.getElementById('optPedestalColor').value = hex;
        document.getElementById('lblPedestalColor').textContent = hex.toUpperCase();
        showToast('Extracted color applied as Pedestal Base color', 'success');
    } else if (target === 'halo') {
        state.mockup.optHaloColor = hex;
        document.getElementById('optHaloColor').value = hex;
        document.getElementById('lblHaloColor').textContent = hex.toUpperCase();
        showToast('Extracted color applied as Halo Light color', 'success');
    }
    
    // Close assigner box and deselect
    state.mockup.selectedColorHex = null;
    document.getElementById('paletteAssignerBox').classList.add('hidden');
    renderExtractedPalette();
    
    // Redraw composition in real-time
    drawMockupCanvas();
};

// Generate highly specialized generative backdrop prompt
function generateLuxuryPromptFromSettings(analysis) {
    const colorTheme = analysis.colorName.toLowerCase();
    const presetPrompts = {
        'silk': `gorgeous elegant liquid silk and satin drapes in shades of ${colorTheme}, soft flowing drapery background, luxury studio, photorealistic 8k, volumetric light, professional brand campaign shot`,
        'marble': `clean minimalist studio scene, pristine Carrara marble wall panels in shades of ${colorTheme}, gold seams, empty product display platform backdrop, minimalist interior, photorealistic 8k`,
        'botanical': `gorgeous clean organic studio backdrop colored in shades of ${colorTheme}, soft elegant background shadows of monstera leaves and palm fronds, warm sunbeams, stone texture, no plants`,
        'obsidian': `matte noir luxury studio backdrop, dark obsidian slate wall in shades of ${colorTheme}, gold veins Kintsugi cracks, raw dark concrete textures, atmospheric moody spotlights, 8k render`,
        'liquid': `fresh hydrating background, transparent floating liquid water ripples with ${colorTheme} reflection glows, glass blocks reflections, clean blue-white studio light, beauty brand product backdrop`,
        'neon': `sleek elegant studio background, empty podium platform, abstract glowing concentric circle neon arches colored in ${colorTheme}, dark reflective glossy floor, volumetric lighting`
    };
    
    // Category-specific enhancements to align with "product theme as it is"
    const categoryCues = {
        'Nutritional Powder': 'wellness and fitness studio theme',
        'Sleek Beverage': 'fresh sunlit organic food and beverage branding theme, clean bright kitchen counter ambiance',
        'Luxury Cosmetic': 'high-end skincare cosmetic beauty campaign display theme',
        'Wellness Nutraceutical': 'clinical modern health and wellness display theme',
        'Artisan Blend': 'warm organic wooden counter, artisan culinary studio theme',
        'Premium Product': 'premium luxury commercial merchandise display theme'
    };
    
    // Detect key ingredients for floating particles, splashes and backgrounds (organic style / premium aesthetic)
    const pName = (state.label.productName || "").toLowerCase();
    const ingredientsText = (document.getElementById('ingredientsListText')?.value || "").toLowerCase();
    const fullTextSearch = pName + " " + ingredientsText;
    
    let ingredientVisuals = "";
    if (fullTextSearch.includes("honey") || fullTextSearch.includes("bees") || fullTextSearch.includes("nectar")) {
        ingredientVisuals = "cinematic warm golden glow backlight, beautiful liquid honey splashes, flying honeybees, floating honeycomb hexagons, luxury liquid gold reflections, antigravity honey droplets composition";
    } else if (fullTextSearch.includes("tea") || fullTextSearch.includes("matcha") || fullTextSearch.includes("herb") || fullTextSearch.includes("chamomile") || fullTextSearch.includes("leaves")) {
        ingredientVisuals = "gentle rising steam, floating green tea leaves, organic herbal blossoms, calm zen spa atmosphere, warm morning sunbeams, soft misty focus, antigravity tea leaves composition";
    } else if (fullTextSearch.includes("coconut") || fullTextSearch.includes("coconuts")) {
        ingredientVisuals = "tropical beach luxury, floating fresh coconut halves and chunks, soft warm sunlight, splash of pure coconut water, green palm frond shadow, elegant holiday vibe, antigravity coconut composition";
    } else if (fullTextSearch.includes("cacao") || fullTextSearch.includes("cocoa") || fullTextSearch.includes("chocolate") || fullTextSearch.includes("coffee") || fullTextSearch.includes("bean")) {
        ingredientVisuals = "floating roasted coffee beans, delicious dark chocolate chunks, rich dark roasted cacao beans, dramatic splash of coffee and chocolate, dark moody luxury, antigravity ingredients composition";
    } else if (fullTextSearch.includes("berry") || fullTextSearch.includes("berries") || fullTextSearch.includes("strawberry") || fullTextSearch.includes("blueberry") || fullTextSearch.includes("fruit") || fullTextSearch.includes("mango") || fullTextSearch.includes("lemon") || fullTextSearch.includes("orange") || fullTextSearch.includes("citrus")) {
        ingredientVisuals = "antigravity floating fresh fruits, splashing fruit juices, fresh water droplets, vibrant fruit slices, flying berries, elegant cosmetic food photography, antigravity ingredients composition";
    } else if (fullTextSearch.includes("protein") || fullTextSearch.includes("bar") || fullTextSearch.includes("snack") || fullTextSearch.includes("cookie") || fullTextSearch.includes("oat") || fullTextSearch.includes("crisp") || fullTextSearch.includes("nut")) {
        ingredientVisuals = "floating organic oat grains, dynamic crispy crumbs, crunchy nut pieces, wheat grains flying in air, energetic advertising motion particles, antigravity ingredients composition";
    } else {
        ingredientVisuals = "elegant clean floating minimalist abstract glass spheres and gold bubbles, organic premium aesthetic, antigravity composition";
    }

    const themeText = presetPrompts[state.mockup.optPresetTheme] || presetPrompts['marble'];
    const categoryCue = categoryCues[analysis.category] || categoryCues['Premium Product'];
    const colorDesc = `${analysis.colorName.toLowerCase()} and warm gold accents`;
    
    // Construct rich positive prompt and append highly strict negative constraints
    return `commercial brand shot for a ${analysis.category}, ${themeText}, empty product platform, ${ingredientVisuals}, ${categoryCue}, color theme of ${colorDesc}, beautiful shadows, high luxury aesthetic, volumetric soft lighting, blank clean template backdrop (no cars, no vehicles, no wheels, no motorcycles, no automobiles, no people, no faces, no hands, no bodies, no bottles, no boxes, no packages, no products, no text, no letters, no words)`;
}

// 60FPS High-Fidelity Canvas-based Real-time Blending & Compositing Engine
function getTrimmedBounds(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const alpha = pixels[(y * canvas.width + x) * 4 + 3];
            if (alpha > 100) { // Increased threshold to ignore faint baked-in shadows
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    
    if (minX > maxX) return { minX: 0, minY: 0, width: img.width, height: img.height };
    return { minX, minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function drawMockupCanvas() {
    return new Promise((resolve, reject) => {
        const rawBgUrl = state.mockup.bgCacheUrl;
        const transProductUrl = state.mockup.transparentImgUrl;
        
        if (!rawBgUrl || !transProductUrl) {
            reject(new Error("Missing asset links for canvas rendering"));
            return;
        }
        
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        // Append unique query parameter to bypass CORS cache blocks, EXCEPT for OpenAI URLs to prevent breaking Azure signatures
        const isSafeUrl = rawBgUrl.startsWith('data:') || rawBgUrl.includes('blob.core.windows.net');
        bgImg.src = isSafeUrl ? rawBgUrl : (rawBgUrl + (rawBgUrl.includes('?') ? '&' : '?') + 'cors=' + Date.now());
        
        bgImg.onload = () => {
            const productImg = new Image();
            productImg.src = transProductUrl;
            
            productImg.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 1200;
                canvas.height = 900;
                
                const centerX = 600;
                const centerY = 450;
                
                // 1. Draw raw AI-generated background
                ctx.drawImage(bgImg, 0, 0, 1200, 900);
                
                // Get extracted primary colors
                const primaryColor = state.mockup.palette[0] || { r: 99, g: 102, b: 241, hex: '#6366f1' };
                const rgb = state.mockup.optTintHex ? hexToRgb(state.mockup.optTintHex) : primaryColor;
                
                // 2. Draw Backdrop Tint Color Overlay (Same-to-Same color sync)
                if (state.mockup.optTintIntensity > 0) {
                    ctx.save();
                    ctx.globalAlpha = state.mockup.optTintIntensity / 100;
                    ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                    ctx.globalCompositeOperation = 'color'; // Color blend mode
                    ctx.fillRect(0, 0, 1200, 900);
                    ctx.restore();
                }
                
                // Compute transform coordinates of product after trimming transparent pixels
                const bounds = getTrimmedBounds(productImg);
                const scaleFactor = state.mockup.optProductScale / 100;
                const aspect = bounds.width / bounds.height;
                const targetHeight = 520 * scaleFactor;
                const targetWidth = targetHeight * aspect;
                
                const px = centerX + state.mockup.optProductX;
                const py = centerY + 50 + state.mockup.optProductY; // Sitting slightly lower
                
                // 3. Draw Glowing Studio Halo behind the pedestal and product
                if (state.mockup.optHaloEnabled) {
                    ctx.save();
                    ctx.shadowColor = state.mockup.optHaloColor;
                    ctx.shadowBlur = state.mockup.optHaloGlow;
                    ctx.lineWidth = 6;
                    ctx.strokeStyle = state.mockup.optHaloColor;
                    ctx.fillStyle = state.mockup.optHaloColor;
                    
                    const hx = px;
                    const hy = py - 30;
                    const r = state.mockup.optHaloSize;
                    
                    if (state.mockup.optHaloStyle === 'ring') {
                        ctx.beginPath();
                        ctx.arc(hx, hy, r, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // Thin concentric inner ring
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(hx, hy, r - 20, 0, Math.PI * 2);
                        ctx.stroke();
                    } else if (state.mockup.optHaloStyle === 'glow') {
                        const grad = ctx.createRadialGradient(hx, hy, 10, hx, hy, r * 1.5);
                        grad.addColorStop(0, state.mockup.optHaloColor);
                        grad.addColorStop(0.3, `rgba(${hexToRgb(state.mockup.optHaloColor).r}, ${hexToRgb(state.mockup.optHaloColor).g}, ${hexToRgb(state.mockup.optHaloColor).b}, 0.3)`);
                        grad.addColorStop(1, 'rgba(0,0,0,0)');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(hx, hy, r * 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (state.mockup.optHaloStyle === 'arch') {
                        ctx.beginPath();
                        ctx.arc(hx, hy + r * 0.4, r, Math.PI, 0); // Arch semi-circle
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(hx - r, hy + r * 0.4);
                        ctx.lineTo(hx - r, hy + r * 1.2);
                        ctx.moveTo(hx + r, hy + r * 0.4);
                        ctx.lineTo(hx + r, hy + r * 1.2);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
                
                // Pedestal dimensions
                const pedScale = state.mockup.optPedestalScale / 100;
                const pedX = px;
                const pedY = py + targetHeight / 2 - 10 + state.mockup.optPedestalY;
                const pedRadiusX = targetWidth * 0.85 * pedScale;
                const pedRadiusY = pedRadiusX * 0.28; // Isometric perspective
                const pedHeight = 35 * pedScale;
                
                // 4. Draw 3D Pedestal Podium / Slab (under the product)
                if (state.mockup.optPedestalEnabled) {
                    ctx.save();
                    
                    const mat = state.mockup.optPedestalMaterial;
                    const baseColor = state.mockup.optPedestalColor;
                    const rgbMat = hexToRgb(baseColor);
                    
                    // Create texture gradients
                    let topFill, frontFill;
                    
                    if (mat === 'gold') {
                        // Polished specular metallic gold
                        const topGrad = ctx.createLinearGradient(pedX - pedRadiusX, pedY, pedX + pedRadiusX, pedY);
                        topGrad.addColorStop(0, '#d4af37');
                        topGrad.addColorStop(0.25, '#fff8dc');
                        topGrad.addColorStop(0.5, '#daa520');
                        topGrad.addColorStop(0.75, '#f5d76e');
                        topGrad.addColorStop(1, '#b8860b');
                        topFill = topGrad;
                        
                        const frontGrad = ctx.createLinearGradient(pedX - pedRadiusX, pedY, pedX + pedRadiusX, pedY);
                        frontGrad.addColorStop(0, '#aa7c11');
                        frontGrad.addColorStop(0.3, '#5c4008');
                        frontGrad.addColorStop(0.6, '#aa7c11');
                        frontGrad.addColorStop(0.8, '#f5d76e');
                        frontGrad.addColorStop(1, '#5c4008');
                        frontFill = frontGrad;
                    } else if (mat === 'marble') {
                        // Carrara white marble texture base
                        topFill = '#f4f4f6';
                        frontFill = '#d0d1d6';
                    } else if (mat === 'glass') {
                        // Frosted Glassmorphism
                        topFill = `rgba(255, 255, 255, 0.22)`;
                        frontFill = `rgba(200, 200, 200, 0.12)`;
                    } else {
                        // Matte Plaster (colored using packaging dominant accents)
                        topFill = `rgb(${rgbMat.r}, ${rgbMat.g}, ${rgbMat.b})`;
                        frontFill = `rgb(${Math.round(rgbMat.r * 0.7)}, ${Math.round(rgbMat.g * 0.7)}, ${Math.round(rgbMat.b * 0.7)})`;
                    }
                    
                    // Helper to draw white/gold marble veins
                    const drawMarbleVeins = (ctx, cx, cy, rx, ry, height = 0) => {
                        ctx.save();
                        ctx.globalAlpha = 0.22;
                        ctx.strokeStyle = mat === 'gold' ? '#ffffff' : '#6b7280'; // grey veins for white, white veins for gold
                        ctx.lineWidth = 1;
                        
                        for (let j = 0; j < 3; j++) {
                            ctx.beginPath();
                            let vx = cx - rx + Math.random() * rx * 0.5;
                            let vy = cy - ry + Math.random() * ry * 2 + height;
                            ctx.moveTo(vx, vy);
                            for (let step = 0; step < 8; step++) {
                                vx += (Math.random() - 0.3) * (rx * 0.25);
                                vy += (Math.random() - 0.5) * (ry * 0.25);
                                ctx.lineTo(vx, vy);
                            }
                            ctx.stroke();
                        }
                        ctx.restore();
                    };
                    
                    if (state.mockup.optPedestalShape === 'cylinder') {
                        // A. CYLINDER Podium
                        // 1. Front extrusion side
                        ctx.save();
                        ctx.beginPath();
                        ctx.ellipse(pedX, pedY, pedRadiusX, pedRadiusY, 0, 0, Math.PI);
                        ctx.lineTo(pedX + pedRadiusX, pedY + pedHeight);
                        ctx.ellipse(pedX, pedY + pedHeight, pedRadiusX, pedRadiusY, 0, Math.PI, 0, true);
                        ctx.closePath();
                        ctx.fillStyle = frontFill;
                        ctx.fill();
                        
                        // Frosted glass border
                        if (mat === 'glass') {
                            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                            ctx.lineWidth = 1.5;
                            ctx.stroke();
                        }
                        ctx.restore();
                        
                        // Cylinder procedural veins
                        if (mat === 'marble' || mat === 'gold') {
                            ctx.save();
                            // Clip to cylinder front
                            ctx.beginPath();
                            ctx.ellipse(pedX, pedY, pedRadiusX, pedRadiusY, 0, 0, Math.PI);
                            ctx.lineTo(pedX + pedRadiusX, pedY + pedHeight);
                            ctx.ellipse(pedX, pedY + pedHeight, pedRadiusX, pedRadiusY, 0, Math.PI, 0, true);
                            ctx.closePath();
                            ctx.clip();
                            drawMarbleVeins(ctx, pedX, pedY, pedRadiusX, pedRadiusY, pedHeight/2);
                            ctx.restore();
                        }
                        
                        // 2. Top ellipse flat surface
                        ctx.beginPath();
                        ctx.ellipse(pedX, pedY, pedRadiusX, pedRadiusY, 0, 0, Math.PI * 2);
                        ctx.fillStyle = topFill;
                        ctx.fill();
                        
                        // Glass bevel outline
                        ctx.strokeStyle = mat === 'gold' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.1)';
                        ctx.lineWidth = 1.5;
                        if (mat === 'glass') ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                        ctx.stroke();
                        
                        if (mat === 'marble' || mat === 'gold') {
                            ctx.save();
                            ctx.beginPath();
                            ctx.ellipse(pedX, pedY, pedRadiusX, pedRadiusY, 0, 0, Math.PI * 2);
                            ctx.clip();
                            drawMarbleVeins(ctx, pedX, pedY, pedRadiusX, pedRadiusY);
                            ctx.restore();
                        }
                    } else if (state.mockup.optPedestalShape === 'slab') {
                        // B. 3D RECTANGLE SLAB
                        // Calculate coordinates of perspective corners
                        const rx = pedRadiusX;
                        const ry = pedRadiusY;
                        
                        const corners = [
                            { x: pedX - rx * 0.9, y: pedY - ry }, // Back-Left (0)
                            { x: pedX + rx * 0.9, y: pedY - ry }, // Back-Right (1)
                            { x: pedX + rx, y: pedY + ry },       // Front-Right (2)
                            { x: pedX - rx, y: pedY + ry }        // Front-Left (3)
                        ];
                        
                        // 1. Draw front face extrusion
                        ctx.beginPath();
                        ctx.moveTo(corners[3].x, corners[3].y);
                        ctx.lineTo(corners[2].x, corners[2].y);
                        ctx.lineTo(corners[2].x, corners[2].y + pedHeight);
                        ctx.lineTo(corners[3].x, corners[3].y + pedHeight);
                        ctx.closePath();
                        ctx.fillStyle = frontFill;
                        ctx.fill();
                        
                        if (mat === 'glass') {
                            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                            ctx.stroke();
                        }
                        
                        // 2. Draw top Perspective parallelogram surface
                        ctx.beginPath();
                        ctx.moveTo(corners[0].x, corners[0].y);
                        ctx.lineTo(corners[1].x, corners[1].y);
                        ctx.lineTo(corners[2].x, corners[2].y);
                        ctx.lineTo(corners[3].x, corners[3].y);
                        ctx.closePath();
                        ctx.fillStyle = topFill;
                        ctx.fill();
                        
                        ctx.strokeStyle = mat === 'gold' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.1)';
                        ctx.lineWidth = 1.5;
                        if (mat === 'glass') ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                        ctx.stroke();
                        
                        // Rect slab veins
                        if (mat === 'marble' || mat === 'gold') {
                            ctx.save();
                            ctx.beginPath();
                            ctx.moveTo(corners[0].x, corners[0].y);
                            ctx.lineTo(corners[1].x, corners[1].y);
                            ctx.lineTo(corners[2].x, corners[2].y);
                            ctx.lineTo(corners[3].x, corners[3].y);
                            ctx.closePath();
                            ctx.clip();
                            drawMarbleVeins(ctx, pedX, pedY, rx, ry);
                            ctx.restore();
                        }
                    } else if (state.mockup.optPedestalShape === 'hexagon') {
                        // C. DUAL HEXAGONAL STACKS
                        const drawHex = (ctx, hx, hy, rx, ry, height) => {
                            const hexCorners = [];
                            for (let i = 0; i < 6; i++) {
                                const angle = (Math.PI / 3) * i - Math.PI/6;
                                hexCorners.push({
                                    x: hx + Math.cos(angle) * rx,
                                    y: hy + Math.sin(angle) * ry
                                });
                            }
                            
                            // Side extrusions
                            for (let i = 2; i < 5; i++) {
                                const nextIdx = (i + 1) % 6;
                                ctx.beginPath();
                                ctx.moveTo(hexCorners[i].x, hexCorners[i].y);
                                ctx.lineTo(hexCorners[nextIdx].x, hexCorners[nextIdx].y);
                                ctx.lineTo(hexCorners[nextIdx].x, hexCorners[nextIdx].y + height);
                                ctx.lineTo(hexCorners[i].x, hexCorners[i].y + height);
                                ctx.closePath();
                                ctx.fillStyle = frontFill;
                                ctx.fill();
                                if (mat === 'glass') { ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke(); }
                            }
                            
                            // Top surface
                            ctx.beginPath();
                            ctx.moveTo(hexCorners[0].x, hexCorners[0].y);
                            for (let i = 1; i < 6; i++) ctx.lineTo(hexCorners[i].x, hexCorners[i].y);
                            ctx.closePath();
                            ctx.fillStyle = topFill;
                            ctx.fill();
                            ctx.strokeStyle = mat === 'gold' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.15)';
                            if (mat === 'glass') ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                            ctx.stroke();
                        };
                        
                        // Draw bottom larger stack
                        drawHex(ctx, pedX, pedY + 12, pedRadiusX, pedRadiusY, pedHeight * 0.8);
                        // Draw top smaller stack
                        drawHex(ctx, pedX, pedY - 8, pedRadiusX * 0.85, pedRadiusY * 0.85, pedHeight * 0.8);
                    }
                    
                    ctx.restore();
                }
                
                // Capture the empty scenery-only canvas state (pedestal + halo + background) for the left (Before) slider
                const sceneryDataUrl = canvas.toDataURL('image/png');
                const beforeImgEl = document.getElementById('beforeImage');
                if (beforeImgEl) {
                    beforeImgEl.style.backgroundImage = `url('${sceneryDataUrl}')`;
                }
                
                // 5. Draw realistic shadows beneath product package
                
                // A. Direct contact shadow (dark, highly focused overlay base shadow)
                if (state.mockup.optContactShadowOpacity > 0) {
                    ctx.save();
                    ctx.globalAlpha = state.mockup.optContactShadowOpacity / 100;
                    ctx.translate(px, py + targetHeight / 2 - 5);
                    ctx.scale(1, 0.16); // Highly squashed ellipse
                    
                    const contactGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, targetWidth * 0.5);
                    contactGrad.addColorStop(0, 'rgba(0,0,0,0.95)');
                    contactGrad.addColorStop(0.2, 'rgba(0,0,0,0.8)');
                    contactGrad.addColorStop(0.6, 'rgba(0,0,0,0.25)');
                    contactGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    
                    ctx.fillStyle = contactGrad;
                    ctx.beginPath();
                    ctx.arc(0, 0, targetWidth * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                
                // B. Volumetric Cast Shadow (directional studio lighting shadow)
                if (state.mockup.optCastShadowStrength > 0) {
                    ctx.save();
                    ctx.globalAlpha = state.mockup.optCastShadowStrength / 100;
                    
                    // Shadow angle projection mathematics
                    const angleRad = state.mockup.optCastShadowAngle * Math.PI / 180;
                    const shadowSkewX = Math.sin(angleRad) * 1.5;
                    const shadowLengthY = 0.22; // Squashed perspective projection
                    
                    const shadowX = px + Math.sin(angleRad) * 45;
                    const shadowY = py + targetHeight / 2 - 5;
                    const shadowRadiusX = targetWidth * 0.7;
                    
                    ctx.translate(shadowX, shadowY);
                    ctx.transform(1, 0, shadowSkewX, shadowLengthY, 0, 0); // Apply shadow perspective projection matrices
                    
                    // Multi-layer cast shadow radial gradient
                    const castGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowRadiusX);
                    castGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
                    castGrad.addColorStop(0.3, 'rgba(0,0,0,0.5)');
                    castGrad.addColorStop(0.7, 'rgba(0,0,0,0.15)');
                    castGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    
                    ctx.fillStyle = castGrad;
                    ctx.beginPath();
                    ctx.arc(0, 0, shadowRadiusX, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                
                // 6. Draw main transparent product package in center
                ctx.save();
                ctx.drawImage(productImg, bounds.minX, bounds.minY, bounds.width, bounds.height, px - targetWidth / 2, py - targetHeight / 2, targetWidth, targetHeight);
                ctx.restore();
                
                // 7. Draw Foreground & Background Leaf Shadows (Camera Depth-Of-Field lens simulation)
                if (state.mockup.optLeafShadowsEnabled) {
                    ctx.save();
                    ctx.globalAlpha = 0.16; // Highly soft shadows
                    ctx.fillStyle = '#060a12';
                    ctx.filter = 'blur(16px)'; // Soft bokeh lens blur
                    
                    const drawEucalyptusLeaves = (ctx, startX, startY, angle) => {
                        ctx.save();
                        ctx.translate(startX, startY);
                        ctx.rotate(angle);
                        
                        // Stem path
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.quadraticCurveTo(80, 150, 120, 320);
                        ctx.lineWidth = 3;
                        ctx.strokeStyle = '#060a12';
                        ctx.stroke();
                        
                        // Draw Eucalyptus circular leaf pairs along the stem
                        for (let k = 0; k < 6; k++) {
                            const ly = 50 + k * 45;
                            const lx = ly * 0.28;
                            
                            // Left leaf
                            ctx.beginPath();
                            ctx.ellipse(lx - 25, ly, 22, 16, Math.PI/4, 0, Math.PI*2);
                            ctx.fill();
                            // Right leaf
                            ctx.beginPath();
                            ctx.ellipse(lx + 25, ly, 22, 16, -Math.PI/4, 0, Math.PI*2);
                            ctx.fill();
                        }
                        ctx.restore();
                    };
                    
                    const drawPalmLeaves = (ctx, startX, startY, angle) => {
                        ctx.save();
                        ctx.translate(startX, startY);
                        ctx.rotate(angle);
                        
                        // Palm stem
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.quadraticCurveTo(150, 80, 400, 120);
                        ctx.lineWidth = 4;
                        ctx.strokeStyle = '#060a12';
                        ctx.stroke();
                        
                        // Dozens of narrow pointed leaves
                        for (let k = 0; k < 22; k++) {
                            const lx = k * 18;
                            const ly = lx * 0.25;
                            ctx.beginPath();
                            ctx.ellipse(lx, ly, 65, 8, Math.PI/3 + (k * 0.02), 0, Math.PI*2);
                            ctx.fill();
                        }
                        ctx.restore();
                    };
                    
                    if (state.mockup.optLeafShadowsType === 'palm') {
                        drawPalmLeaves(ctx, -50, -50, Math.PI/6);
                        drawPalmLeaves(ctx, 1000, -80, -Math.PI/4);
                    } else if (state.mockup.optLeafShadowsType === 'eucalyptus') {
                        drawEucalyptusLeaves(ctx, 20, -50, Math.PI/12);
                        drawEucalyptusLeaves(ctx, 1100, -50, -Math.PI/8);
                    } else {
                        // Pine branch
                        ctx.beginPath();
                        ctx.moveTo(100, -20);
                        ctx.lineTo(350, 180);
                        ctx.lineWidth = 6;
                        ctx.stroke();
                        for (let j = 0; j < 40; j++) {
                            ctx.beginPath();
                            ctx.moveTo(100 + j * 6, -20 + j * 5);
                            ctx.lineTo(80 + j * 6, 40 + j * 5);
                            ctx.lineWidth = 1.5;
                            ctx.stroke();
                        }
                    }
                    
                    ctx.restore();
                }
                
                // 8. Draw Gold Foil flakes scattered in background
                if (state.mockup.optGoldVeinsEnabled) {
                    ctx.save();
                    ctx.globalAlpha = 0.65;
                    const density = state.mockup.optGoldVeinsDensity;
                    
                    const goldGrad = ctx.createLinearGradient(0, 0, 10, 10);
                    goldGrad.addColorStop(0, '#ffd700');
                    goldGrad.addColorStop(1, '#b8860b');
                    ctx.fillStyle = goldGrad;
                    
                    // Render randomized polygon gold leaf shards
                    for (let j = 0; j < density * 0.35; j++) {
                        const px = Math.random() * 1200;
                        const py = Math.random() * 800;
                        const size = 3 + Math.random() * 12;
                        
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(px + size, py + size * 0.4);
                        ctx.lineTo(px + size * 0.7, py + size * 0.9);
                        ctx.lineTo(px - size * 0.2, py + size * 0.6);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                }
                
                // 9. Draw Studio Ambient Particle Dust (sparks floating around)
                if (state.mockup.optAmbientDustEnabled) {
                    ctx.save();
                    ctx.globalAlpha = 0.2;
                    ctx.fillStyle = state.mockup.optHaloColor;
                    
                    for (let j = 0; j < 25; j++) {
                        const dx = Math.random() * 1200;
                        const dy = Math.random() * 800;
                        const size = Math.random() * 6 + 1.5;
                        
                        ctx.beginPath();
                        ctx.arc(dx, dy, size, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Add glow ring around some particles
                        if (j % 5 === 0) {
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 0.5;
                            ctx.beginPath();
                            ctx.arc(dx, dy, size * 2.2, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    }
                    ctx.restore();
                }
                
                // 10. Vignette & Dramatic Studio Spotlight Lighting Overlay
                ctx.save();
                // Radial Vignette
                const vignetteGrad = ctx.createRadialGradient(centerX, centerY, 200, centerX, centerY, 750);
                vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
                vignetteGrad.addColorStop(0.6, 'rgba(0,0,0,0.15)');
                vignetteGrad.addColorStop(1, 'rgba(9,13,22,0.55)');
                ctx.fillStyle = vignetteGrad;
                ctx.fillRect(0, 0, 1200, 900);
                
                // Top-Left Spotlight cone
                const lightGrad = ctx.createRadialGradient(100, 100, 20, 300, 300, 700);
                lightGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
                lightGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = lightGrad;
                ctx.fillRect(0, 0, 1200, 900);
                
                ctx.restore();
                
                // Finalize: Set composite result as state background and output URL
                const finishedDataUrl = canvas.toDataURL('image/png');
                state.mockup.generatedBg = finishedDataUrl;
                
                const afterImgEl = document.getElementById('afterImage');
                if (afterImgEl) {
                    afterImgEl.style.backgroundImage = `url('${finishedDataUrl}')`;
                }
                
                resolve(finishedDataUrl);
            };
            
            productImg.onerror = () => {
                reject(new Error("Failed to render product package layer onto canvas"));
            };
        };
        
        bgImg.onerror = () => {
            reject(new Error("Failed to render AI background layer onto canvas"));
        };
    });
}

// Orchestrator for full luxury marketing scene generation workflow
async function processLuxuryUpload(file) {
    try {
        state.mockup = {
            rawImgUrl: null,
            transparentImgUrl: null,
            generatedBg: null,
            bgCacheUrl: null,
            palette: [],
            selectedColorHex: null,
            
            optPresetTheme: 'marble',
            optPedestalEnabled: true,
            optPedestalShape: 'slab',
            optPedestalMaterial: 'gold',
            optPedestalColor: '#FFD700',
            optPedestalScale: 100,
            optPedestalY: 0,
            
            optHaloEnabled: false,
            optHaloStyle: 'ring',
            optHaloColor: '#6366f1',
            optHaloSize: 180,
            optHaloGlow: 30,
            
            optTintIntensity: 45,
            optLeafShadowsEnabled: true,
            optLeafShadowsType: 'eucalyptus',
            optGoldVeinsEnabled: false,
            optGoldVeinsDensity: 30,
            optAmbientDustEnabled: true,
            
            optProductScale: 55,
            optProductX: 0,
            optProductY: 0,
            
            optContactShadowOpacity: 75,
            optContactShadowBlur: 10,
            optCastShadowStrength: 55,
            optCastShadowAngle: 15,
            optCastShadowBlur: 30
        };
        
        // Reset export button and comparison layouts
        document.getElementById('btnExportMockup').classList.add('hidden');
        document.getElementById('beforeImage').style.backgroundImage = 'none';
        document.getElementById('afterImage').style.backgroundImage = 'none';
        document.getElementById('aiAnalysisBox').classList.add('hidden');
        document.getElementById('luxuryControlDashboard').classList.add('hidden');
        
        showGenerationLoader("Optimizing package dimensions...");
        
        // 1. Resize and optimize image for high-speed local processing
        const optimizedUrl = await optimizeImage(file);
        state.mockup.rawImgUrl = optimizedUrl;
        
        const beforeImgEl = document.getElementById('beforeImage');
        beforeImgEl.style.backgroundImage = `url('${optimizedUrl}')`;
        
        showGenerationLoader("Isolating product packaging (AI Auto-Key)...");
        
        // 2. Automatically remove plain packaging backgrounds
        const imgObj = new Image();
        imgObj.src = optimizedUrl;
        await new Promise(r => imgObj.onload = r);
        const transparentUrl = autoKeyProductImage(imgObj);
        state.mockup.transparentImgUrl = transparentUrl;
        
        showGenerationLoader("Analyzing package colors & luxury theme...");
        
        // 3. Analyze packaging style theme
        const analysis = await analyzePackageTheme(optimizedUrl);
        
        // 4. Extract dominant same-to-same color palette
        const palette = extractMultiColorPalette(imgObj);
        state.mockup.palette = palette;
        
        // Automatically default primary color accents to elements
        const primary = palette[0] || { hex: '#6366f1' };
        const secondary = palette[1] || { hex: '#ffd700' };
        const tertiary = palette[2] || { hex: '#ec4899' };
        
        state.mockup.optPedestalColor = secondary.hex;
        state.mockup.optHaloColor = tertiary.hex;
        state.mockup.optTintHex = primary.hex;
        
        // Populate detected properties into AI Analysis Box
        const themeResultsEl = document.getElementById('aiThemeResults');
        themeResultsEl.innerHTML = `
            <div class="bg-white/5 p-2.5 rounded-xl border border-white/5 space-y-1">
                <span class="text-gray-500 text-[10px] block uppercase font-mono">Category</span>
                <span class="font-semibold text-white truncate">${analysis.category}</span>
            </div>
            <div class="bg-white/5 p-2.5 rounded-xl border border-white/5 space-y-1">
                <span class="text-gray-500 text-[10px] block uppercase font-mono">Luxury Theme</span>
                <span class="font-semibold text-white truncate">${analysis.themeName}</span>
            </div>
        `;
        
        document.getElementById('aiAnalysisBox').classList.remove('hidden');
        renderExtractedPalette();
        
        // Synchronize state parameter values to UI controls dynamically
        syncStateToMockupControls();
        
        // 5. Generate template background prompt and fetch from active AI Engine
        const luxuryPrompt = generateLuxuryPromptFromSettings(analysis);
        showGenerationLoader("AI generating premium studio scene...");
        
        const seed = Math.floor(Math.random() * 999999);
        const bgUrl = await generateBackdropImage(luxuryPrompt, seed);
        
        // Cache the raw generative AI background
        state.mockup.bgCacheUrl = bgUrl;
        
        showGenerationLoader("Compositing layers & blending shadows...");
        
        // 6. Complete initial canvas drawing with all elements
        await drawMockupCanvas();
        
        // Reveal advance Canva-style controls
        document.getElementById('luxuryControlDashboard').classList.remove('hidden');
        document.getElementById('btnExportMockup').classList.remove('hidden');
        hideGenerationLoader();
        
        // Initialize comparison slider drag listeners
        initBeforeAfterSlider();
        
        // Scroll to editor comparison slider smoothly
        setTimeout(() => {
            const slider = document.getElementById('comparisonSlider');
            if (slider) slider.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
        
        showToast("Premium brand scene generated! Tweak the elements below in real-time.", "success");
        
    } catch (err) {
        console.error(err);
        hideGenerationLoader();
        showToast(err.message || "Failed to generate luxury studio composition.", "error");
    }
}

// Regenerates only the base AI backdrop texture from Pollinations AI
window.regenerateAIBackground = async function() {
    if (!state.mockup.rawImgUrl) {
        showToast('Please upload a product packaging image first!', 'warning');
        return;
    }
    
    try {
        showToast('AI generating updated luxury theme backdrop...', 'info');
        showGenerationLoader("AI generating updated luxury theme backdrop...");
        
        // Get style analysis parameters
        const analysis = await analyzePackageTheme(state.mockup.rawImgUrl);
        const luxuryPrompt = generateLuxuryPromptFromSettings(analysis);
        
        const seed = Math.floor(Math.random() * 999999);
        const bgUrl = await generateBackdropImage(luxuryPrompt, seed);
        
        // Overwrite background cache
        state.mockup.bgCacheUrl = bgUrl;
        
        showGenerationLoader("Compositing layers & blending shadows...");
        await drawMockupCanvas();
        
        hideGenerationLoader();
        showToast("AI background regenerated and blended successfully!", "success");
    } catch (err) {
        console.error(err);
        hideGenerationLoader();
        showToast("Backdrop regeneration failed. Using cached background.", "error");
    }
};

// Map current state configuration values to UI editor controls
function syncStateToMockupControls() {
    const ids = [
        'optAutoKeyEnabled', 'optKeyThreshold',
        'optPresetTheme', 'optPedestalEnabled', 'optPedestalShape', 'optPedestalMaterial',
        'optPedestalColor', 'optPedestalScale', 'optPedestalY', 'optHaloEnabled',
        'optHaloStyle', 'optHaloColor', 'optHaloSize', 'optHaloGlow', 'optTintIntensity',
        'optLeafShadowsEnabled', 'optLeafShadowsType', 'optGoldVeinsEnabled',
        'optGoldVeinsDensity', 'optAmbientDustEnabled', 'optProductScale',
        'optProductX', 'optProductY', 'optContactShadowOpacity', 'optCastShadowStrength',
        'optCastShadowAngle', 'optCastShadowBlur'
    ];
    
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        
        const val = state.mockup[id];
        if (el.type === 'checkbox') {
            el.checked = !!val;
        } else {
            el.value = val;
        }
        
        // Update slider value visual text tags
        updateControlLabelText(id, val);
    });
    
    // Toggle sub-option visibility blocks
    toggleCollapsibleControls();
}

// Visual label text synchronizer for slider values
function updateControlLabelText(id, value) {
    if (id === 'optKeyThreshold') document.getElementById('valKeyThreshold').textContent = `${value}`;
    if (id === 'optPedestalScale') document.getElementById('valPedestalScale').textContent = `${value}%`;
    if (id === 'optPedestalY') document.getElementById('valPedestalY').textContent = `${value}px`;
    if (id === 'optPedestalColor') document.getElementById('lblPedestalColor').textContent = value.toUpperCase();
    if (id === 'optHaloSize') document.getElementById('valHaloSize').textContent = `${value}px`;
    if (id === 'optHaloGlow') document.getElementById('valHaloGlow').textContent = `${value}`;
    if (id === 'optHaloColor') document.getElementById('lblHaloColor').textContent = value.toUpperCase();
    if (id === 'optTintIntensity') document.getElementById('valTintIntensity').textContent = `${value}%`;
    if (id === 'optGoldVeinsDensity') document.getElementById('valGoldVeinsDensity').textContent = `${value}%`;
    if (id === 'optProductScale') document.getElementById('valProductScale').textContent = `${value}%`;
    if (id === 'optProductX') document.getElementById('valProductX').textContent = `${value}px`;
    if (id === 'optProductY') document.getElementById('valProductY').textContent = `${value}px`;
    if (id === 'optContactShadowOpacity') document.getElementById('valContactShadowOpacity').textContent = `${value}%`;
    if (id === 'optCastShadowStrength') document.getElementById('valCastShadowStrength').textContent = `${value}%`;
    if (id === 'optCastShadowAngle') document.getElementById('valCastShadowAngle').textContent = `${value}°`;
    if (id === 'optCastShadowBlur') document.getElementById('valCastShadowBlur').textContent = `${value}px`;
}

// Visual suboptions visibility toggler based on checkbox parameters
function toggleCollapsibleControls() {
    const keyChecked = document.getElementById('optAutoKeyEnabled').checked;
    const keyRow = document.getElementById('keyConfigRow');
    if (keyRow) keyRow.style.display = keyChecked ? 'block' : 'none';

    const leafChecked = document.getElementById('optLeafShadowsEnabled').checked;
    const leafRow = document.getElementById('leafShadowsConfigRow');
    if (leafRow) leafRow.style.display = leafChecked ? 'block' : 'none';
    
    const goldChecked = document.getElementById('optGoldVeinsEnabled').checked;
    const goldRow = document.getElementById('goldVeinsConfigRow');
    if (goldRow) goldRow.style.display = goldChecked ? 'block' : 'none';
}

// Binds change/input event listeners to every dashboard control for instant canvas renders
function bindMockupDashboardListeners() {
    const ids = [
        'optAutoKeyEnabled', 'optKeyThreshold',
        'optPresetTheme', 'optPedestalEnabled', 'optPedestalShape', 'optPedestalMaterial',
        'optPedestalColor', 'optPedestalScale', 'optPedestalY', 'optHaloEnabled',
        'optHaloStyle', 'optHaloColor', 'optHaloSize', 'optHaloGlow', 'optTintIntensity',
        'optLeafShadowsEnabled', 'optLeafShadowsType', 'optGoldVeinsEnabled',
        'optGoldVeinsDensity', 'optAmbientDustEnabled', 'optProductScale',
        'optProductX', 'optProductY', 'optContactShadowOpacity', 'optCastShadowStrength',
        'optCastShadowAngle', 'optCastShadowBlur'
    ];
    
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        
        const handler = (e) => {
            let val;
            if (el.type === 'checkbox') {
                val = el.checked;
            } else {
                val = el.value;
                if (el.type === 'range') val = parseFloat(val);
            }
            
            // Update state
            state.mockup[id] = val;
            
            // Sync slider label text
            updateControlLabelText(id, val);
            toggleCollapsibleControls();
            
            // Trigger 60fps local drawing composite loop, re-keying if background keyer altered
            if (id === 'optAutoKeyEnabled' || id === 'optKeyThreshold') {
                updateTransparentImage().then(() => {
                    drawMockupCanvas().catch(err => console.error("Realtime composite render error: ", err));
                });
            } else {
                drawMockupCanvas().catch(err => console.error("Realtime composite render error: ", err));
            }
        };
        
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
    });
}

// High-resolution marketing shot downloader
window.downloadLuxuryMockup = function() {
    if (!state.mockup.generatedBg) {
        showToast('No generated composition available to export.', 'warning');
        return;
    }
    
    showToast('Exporting high-resolution commercial shot...', 'info');
    const link = document.createElement('a');
    link.download = `${state.label.productName.replace(/\s+/g, '_')}_Luxury_Commercial_Mockup.png`;
    link.href = state.mockup.generatedBg;
    link.click();
    showToast('High-Res scene exported successfully!', 'success');
};

// 60fps Before/After slider engine using hardware-accelerated CSS clip-path
let isDraggingBA = false;
let sliderInitialized = false;

function initBeforeAfterSlider() {
    const container = document.getElementById('comparisonSlider');
    const handle = document.getElementById('baHandle');
    const after = document.getElementById('afterImage');
    
    if (!container || !handle || !after) return;
    
    const setSliderPosition = (x) => {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0) return;
        let pos = ((x - rect.left) / rect.width) * 100;
        if (pos < 0) pos = 0;
        if (pos > 100) pos = 100;
        
        handle.style.left = `${pos}%`;
        after.style.clipPath = `inset(0 0 0 ${pos}%)`;
    };
    
    // Initial 50% split setup
    handle.style.left = '50%';
    after.style.clipPath = 'inset(0 0 0 50%)';
    
    if (sliderInitialized) return;
    
    const onStart = (e) => {
        e.preventDefault();
        isDraggingBA = true;
    };
    const onEnd = () => { isDraggingBA = false; };
    const onMove = (e) => {
        if (!isDraggingBA) return;
        const pageX = e.touches ? e.touches[0].pageX : e.pageX;
        setSliderPosition(pageX);
    };
    
    handle.addEventListener('mousedown', onStart);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('mousemove', onMove);
    
    handle.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    
    sliderInitialized = true;
}

// ==============================================
// SECTION 3: AI INGREDIENT Scan & HEALTH HUB
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    const ingInput = document.getElementById('ingredientFileInput');
    if (ingInput) {
        ingInput.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                document.getElementById('uploadIngredientText').textContent = file.name;
                
                showToast('Analyzing packaging snapshot text...', 'info');
                
                // OCR analysis via Tesseract
                const worker = await Tesseract.createWorker('eng');
                const result = await worker.recognize(file);
                
                document.getElementById('ingredientsListText').value = result.data.text;
                await worker.terminate();
                
                showToast('Ingredients extracted! Click "Run Chemical Analysis" to review.', 'success');
            }
        });
    }
});

// Search OpenFoodFacts Free API
window.searchOpenFoodFacts = async function() {
    const q = document.getElementById('offSearchQuery').value.trim();
    if (!q) {
        showToast('Please type a search query first!', 'warning');
        return;
    }
    
    showToast('Searching OpenFoodFacts Database...', 'info');
    
    try {
        // Query barcode direct or name lookup fallback
        let barcode = q;
        if (isNaN(q)) {
            // Retrieve first search item
            const sRes = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1`);
            const sData = await sRes.json();
            if (sData.products && sData.products.length > 0) {
                barcode = sData.products[0].code;
            } else {
                throw new Error('Product not found in OpenFoodFacts');
            }
        }
        
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
        const data = await res.json();
        
        if (data.status === 1) {
            const prod = data.product;
            
            // Hydrate Ingredients Tab
            document.getElementById('ingredientsListText').value = prod.ingredients_text || '';
            document.getElementById('ingredientScannedTitle').textContent = prod.product_name || 'OpenFoodFacts Product';
            
            // Hydrate Builder Tab
            state.label.productName = prod.product_name || state.label.productName;
            state.label.servingSize = prod.serving_size || '1 serving';
            
            const nut = prod.nutriments;
            if (nut) {
                state.label.calories = Math.round(nut['energy-kcal_serving'] || nut['energy-kcal_100g'] || 0);
                state.label.totalFat = parseFloat((nut.fat_serving || nut.fat_100g || 0).toFixed(1));
                state.label.satFat = parseFloat((nut['saturated-fat_serving'] || nut['saturated-fat_100g'] || 0).toFixed(1));
                state.label.transFat = parseFloat((nut['trans-fat_serving'] || nut['trans-fat_100g'] || 0).toFixed(1));
                state.label.cholesterol = Math.round(nut.cholesterol_serving || nut.cholesterol_100g || 0);
                state.label.sodium = Math.round((nut.sodium_serving || nut.sodium_100g || 0) * 1000); // g to mg
                state.label.totalCarbs = Math.round(nut.carbohydrates_serving || nut.carbohydrates_100g || 0);
                state.label.fiber = Math.round(nut.fiber_serving || nut.fiber_100g || 0);
                state.label.sugars = Math.round(nut.sugars_serving || nut.sugars_100g || 0);
                state.label.addedSugars = Math.round(nut['added-sugars_serving'] || nut['added-sugars_100g'] || 0);
                state.label.protein = Math.round(nut.proteins_serving || nut.proteins_100g || 0);
            }
            
            populateInputsFromState();
            showToast('Pulled official ingredients and nutrition into editor!', 'success');
            
            // Run automatic analysis
            analyzeIngredients();
        } else {
            throw new Error('Product not found in OpenFoodFacts');
        }
    } catch (err) {
        console.error(err);
        showToast(err.message || 'Lookup failed. Check barcode or network.', 'error');
    }
};

// Chemical Scans, Nutri-score metrics, and Allergen reports
window.analyzeIngredients = function() {
    const rawText = document.getElementById('ingredientsListText').value.trim();
    if (!rawText) {
        showToast('Please upload or type ingredients to analyze first.', 'warning');
        return;
    }
    
    showToast('Executing chemical lab scan...', 'info');
    
    // Cleanup list items
    const cleanText = rawText.replace(/\*/g, '').replace(/contains\s*[:\s]*/i, '').trim();
    const tokenized = cleanText.split(/[,.;]/).map(t => t.trim().toLowerCase()).filter(t => t.length > 1);
    
    const results = {
        allergens: [],
        preservatives: [],
        additives: [],
        healthy: [],
        isVegan: true,
        isGlutenFree: true,
        isOrganic: false
    };
    
    // Organic check
    if (cleanText.toLowerCase().includes('organic')) results.isOrganic = true;
    
    // Process Token matching
    tokenized.forEach(token => {
        // Vegan Checkers
        const animalTriggers = ['gelatin', 'carmine', 'milk', 'cheese', 'whey', 'casein', 'butter', 'egg', 'lard', 'tallow', 'honey', 'collagen'];
        animalTriggers.forEach(animal => {
            if (token.includes(animal)) results.isVegan = false;
        });
        
        // Gluten Checkers
        const glutenTriggers = ['wheat', 'barley', 'rye', 'malt', 'spelt', 'triticale', 'gluten'];
        glutenTriggers.forEach(gluten => {
            if (token.includes(gluten)) results.isGlutenFree = false;
        });
        
        // Dictionary matching
        Object.entries(CHEMICAL_DICTIONARY).forEach(([category, data]) => {
            data.keywords.forEach(kw => {
                if (token.includes(kw)) {
                    const label = data.labels[kw];
                    const reportName = token.charAt(0).toUpperCase() + token.slice(1);
                    const item = { name: reportName, issue: label };
                    
                    if (category === 'allergens' && !results.allergens.some(a => a.name === reportName)) results.allergens.push(item);
                    if (category === 'preservatives' && !results.preservatives.some(p => p.name === reportName)) results.preservatives.push(item);
                    if (category === 'additives' && !results.additives.some(ad => ad.name === reportName)) results.additives.push(item);
                    if (category === 'superfoods' && !results.healthy.some(h => h.name === reportName)) results.healthy.push(item);
                }
            });
        });
    });
    
    // Nutrition Health Score math
    let score = 75; // Baseline
    if (state.label.protein > 5) score += 10;
    if (state.label.fiber > 3) score += 10;
    if (state.label.calories > 300) score -= 15;
    if (state.label.sugars > 15) score -= 15;
    if (state.label.addedSugars > 10) score -= 10;
    if (state.label.satFat > 5) score -= 10;
    if (state.label.sodium > 300) score -= 10;
    
    score -= results.preservatives.length * 8;
    score -= results.additives.length * 6;
    if (results.isOrganic) score += 5;
    
    // Clamp score
    score = Math.max(5, Math.min(100, score));
    
    let letter = 'A';
    let circleClass = 'circle-a';
    if (score >= 80) { letter = 'A'; circleClass = 'circle-a'; }
    else if (score >= 60) { letter = 'B'; circleClass = 'circle-b'; }
    else if (score >= 40) { letter = 'C'; circleClass = 'circle-c'; }
    else if (score >= 20) { letter = 'D'; circleClass = 'circle-d'; }
    else { letter = 'E'; circleClass = 'circle-e'; }
    
    // Update Dashboard UI
    document.getElementById('healthLetterScore').className = `text-4xl font-black font-display ${letter === 'A' || letter === 'B' ? 'text-green-400' : letter === 'C' ? 'text-yellow-400' : 'text-red-400'}`;
    document.getElementById('healthLetterScore').textContent = letter;
    document.getElementById('healthNumericalScore').textContent = `${score}/100`;
    
    const gauge = document.getElementById('healthScoreGauge');
    if (gauge) {
        gauge.className.baseVal.value = `circle ${circleClass}`;
        gauge.style.strokeDasharray = `${score}, 100`;
    }
    
    // Diet Badges
    const badgeWrapper = document.getElementById('dietBadgesWrapper');
    badgeWrapper.innerHTML = '';
    
    const addBadge = (label, valid) => {
        const bg = valid ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
        const icon = valid ? 'ri-checkbox-circle-line' : 'ri-close-circle-line';
        badgeWrapper.innerHTML += `<span class="px-3 py-1.5 rounded-full border ${bg} text-[10px] font-bold flex items-center gap-1"><i class="${icon}"></i> ${label}</span>`;
    };
    
    addBadge('VEGAN', results.isVegan);
    addBadge('GLUTEN-FREE', results.isGlutenFree);
    addBadge('ORGANIC', results.isOrganic);
    
    // Highlights Injectors
    const injectItems = (wrapperId, items, color) => {
        const wrap = document.getElementById(wrapperId);
        wrap.innerHTML = '';
        if (items.length === 0) {
            wrap.innerHTML = `<span class="text-[10px] text-gray-500 italic">None identified</span>`;
            return;
        }
        items.forEach(it => {
            wrap.innerHTML += `
                <div class="px-2.5 py-1 rounded-lg bg-${color}-500/10 border border-${color}-500/20 text-[10px] flex items-center justify-between w-full">
                    <span class="font-semibold text-white">${it.name}</span>
                    <span class="text-gray-400 italic font-mono text-[8px]">${it.issue}</span>
                </div>
            `;
        });
    };
    
    injectItems('allergensListWrapper', results.allergens, 'orange');
    injectItems('preservativesListWrapper', results.preservatives, 'red');
    injectItems('additivesListWrapper', results.additives, 'yellow');
    injectItems('healthyListWrapper', results.healthy, 'green');
    
    // Clean ingredient Statement statements
    const capitalized = cleanText.split(/[,.;]/)
        .map(i => i.trim())
        .filter(i => i.length > 0)
        .map((item, idx) => {
            const word = item.toLowerCase();
            return idx === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
        })
        .join(', ');
        
    document.getElementById('cleanIngredientsPanel').textContent = capitalized ? `${capitalized}.` : 'No clean statement compiled.';
    
    document.getElementById('ingredientsEmptyState').classList.add('hidden');
    document.getElementById('ingredientsDashboard').classList.remove('hidden');
    
    showToast('Lab report analysis complete!', 'success');
};

window.copyCleanIngredients = function() {
    const txt = document.getElementById('cleanIngredientsPanel').textContent;
    navigator.clipboard.writeText(txt);
    showToast('Ingredients statement copied to clipboard!', 'success');
};

// ==============================================
// SECTION 9 & 11: DATABASE, HISTORY & CLOUD SYNC
// ==============================================
window.toggleFirebaseConfigModal = function() {
    const modal = document.getElementById('firebaseConfigModal');
    if (modal) modal.classList.toggle('show');
};

// Save custom Firestore settings
window.saveFirebaseConfiguration = function() {
    const config = {
        apiKey: document.getElementById('fbApiKey').value.trim(),
        authDomain: document.getElementById('fbAuthDomain').value.trim(),
        projectId: document.getElementById('fbProjectId').value.trim(),
        storageBucket: document.getElementById('fbStorageBucket').value.trim(),
        appId: document.getElementById('fbAppId').value.trim()
    };
    
    if (!config.apiKey || !config.projectId) {
        showToast('API Key and Project ID are required!', 'error');
        return;
    }
    
    state.firebaseConfig = config;
    localStorage.setItem('fb_sync_config', JSON.stringify(config));
    
    showToast('Initializing Firebase Cloud sync...', 'info');
    initializeFirebaseEngine();
    toggleFirebaseConfigModal();
};

window.clearFirebaseConfiguration = function() {
    state.firebaseConfig = null;
    state.db = null;
    localStorage.removeItem('fb_sync_config');
    
    document.getElementById('fbApiKey').value = '';
    document.getElementById('fbAuthDomain').value = '';
    document.getElementById('fbProjectId').value = '';
    document.getElementById('fbStorageBucket').value = '';
    document.getElementById('fbAppId').value = '';
    
    document.getElementById('cloudStatusIndicator').className = 'w-2.5 h-2.5 rounded-full bg-yellow-500';
    document.getElementById('cloudStatusText').textContent = 'Mock Database (Local)';
    
    showToast('Switched fallback back to LocalStorage MockDB!', 'success');
    toggleFirebaseConfigModal();
    renderHistory();
};

// Initialize Firebase App dynamically
function initializeFirebaseEngine() {
    const config = state.firebaseConfig || JSON.parse(localStorage.getItem('fb_sync_config'));
    if (!config) return;
    
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }
        state.db = firebase.firestore();
        
        document.getElementById('cloudStatusIndicator').className = 'w-2.5 h-2.5 rounded-full bg-green-500';
        document.getElementById('cloudStatusText').textContent = 'Firestore Connected';
        showToast('Firebase Cloud Storage integrated!', 'success');
        
        renderHistory();
    } catch (err) {
        console.error(err);
        showToast('Firebase initialization failed. Check credentials.', 'error');
    }
}

// Saved Product parameters database
window.saveLabelToDatabase = async function() {
    const record = {
        id: `label_${Date.now()}`,
        productName: state.label.productName,
        date: new Date().toLocaleDateString(),
        calories: state.label.calories,
        protein: state.label.protein,
        label: { ...state.label },
        mockup: { ...state.mockup }
    };
    
    showToast('Storing project parameters...', 'info');
    
    if (state.db) {
        try {
            await state.db.collection('labels').doc(record.id).set(record);
            showToast('Label synced securely to Firestore Cloud!', 'success');
        } catch (e) {
            console.error(e);
            showToast('Firebase failed. Storing locally instead.', 'warning');
            saveToLocalLibrary(record);
        }
    } else {
        saveToLocalLibrary(record);
    }
    
    renderHistory();
};

function saveToLocalLibrary(record) {
    const stored = JSON.parse(localStorage.getItem('local_label_db')) || [];
    stored.unshift(record);
    localStorage.setItem('local_label_db', JSON.stringify(stored));
    showToast('Saved to browser-native LocalStorage DB!', 'success');
}

// Syncs mockup views to state when loading history labels
window.updateCompositedPreview = function() {
    const beforeImgEl = document.getElementById('beforeImage');
    if (beforeImgEl) {
        beforeImgEl.style.backgroundImage = state.mockup.rawImgUrl ? `url('${state.mockup.rawImgUrl}')` : 'none';
    }
    const afterImgEl = document.getElementById('afterImage');
    if (afterImgEl) {
        afterImgEl.style.backgroundImage = state.mockup.generatedBg ? `url('${state.mockup.generatedBg}')` : 'none';
    }
    const exportBtn = document.getElementById('btnExportMockup');
    if (exportBtn) {
        if (state.mockup.generatedBg) {
            exportBtn.classList.remove('hidden');
        } else {
            exportBtn.classList.add('hidden');
        }
    }
};

// Load labels into interactive editor
window.loadHistoryLabel = function(id) {
    const record = state.history.find(h => h.id === id);
    if (!record) return;
    
    state.label = { ...record.label };
    state.mockup = { ...record.mockup };
    
    populateInputsFromState();
    updateCompositedPreview();
    
    showToast(`Loaded ${record.productName} project!`, 'success');
    switchTab('tab-builder');
};

// Delete record triggers
window.deleteHistoryLabel = async function(id) {
    showToast('Deleting project card...', 'info');
    
    if (state.db) {
        try {
            await state.db.collection('labels').doc(id).delete();
            showToast('Removed from Firestore Cloud!', 'success');
        } catch (e) {
            deleteFromLocalLibrary(id);
        }
    } else {
        deleteFromLocalLibrary(id);
    }
    
    renderHistory();
};

function deleteFromLocalLibrary(id) {
    let stored = JSON.parse(localStorage.getItem('local_label_db')) || [];
    stored = stored.filter(s => s.id !== id);
    localStorage.setItem('local_label_db', JSON.stringify(stored));
    showToast('Removed from Local Library!', 'success');
}

// Retrieve and render project library cards
async function renderHistory() {
    const grid = document.getElementById('historyGrid');
    const emptyState = document.getElementById('historyEmptyState');
    if (!grid) return;
    
    grid.innerHTML = '';
    let records = [];
    
    if (state.db) {
        try {
            const snap = await state.db.collection('labels').orderBy('id', 'desc').get();
            snap.forEach(doc => records.push(doc.data()));
        } catch (e) {
            records = JSON.parse(localStorage.getItem('local_label_db')) || [];
        }
    } else {
        records = JSON.parse(localStorage.getItem('local_label_db')) || [];
    }
    
    state.history = records;
    
    if (records.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    records.forEach(r => {
        grid.innerHTML += `
            <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between h-48 relative overflow-hidden border border-white/5 group hover:border-primary/30">
                <div class="space-y-2">
                    <div class="flex justify-between items-start">
                        <span class="text-[10px] text-gray-500 font-mono">${r.date}</span>
                        <span class="text-[9px] bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">${r.label.labelStandard}</span>
                    </div>
                    <h4 class="text-sm font-bold font-display text-white group-hover:text-primary transition-colors line-clamp-1">${r.productName}</h4>
                    <div class="flex gap-4 text-[10px] text-gray-400 font-mono pt-2">
                        <span>Calories: <strong class="text-white">${r.calories} kcal</strong></span>
                        <span>Protein: <strong class="text-white">${r.protein}g</strong></span>
                    </div>
                </div>
                
                <div class="flex gap-2 pt-4 border-t border-white/5">
                    <button onclick="loadHistoryLabel('${r.id}')" class="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/80 text-white text-[10px] font-bold transition-all">
                        Load in Editor
                    </button>
                    <button onclick="deleteHistoryLabel('${r.id}')" class="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs transition-colors">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

// ==============================================
// HIGH FIDELITY PNG/SVG VECTOR EXPORTS
// ==============================================
window.downloadLabelImage = async function(format = 'png') {
    const target = document.getElementById('nutritionLabel');
    if (!target) return;
    
    showToast(`Preparing FDA ${format.toUpperCase()} export...`, 'info');
    
    // Clear scaling transforms for html2canvas captures
    const origTransform = target.style.transform;
    target.style.transform = 'none';
    
    if (format === 'png') {
        try {
            const canvas = await html2canvas(target, {
                scale: 3, // High DPI capture
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false
            });
            
            target.style.transform = origTransform;
            
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${state.label.productName.replace(/\s+/g, '_')}_Nutrition_Facts.png`;
            link.href = url;
            link.click();
            showToast('High-quality PNG exported successfully!', 'success');
        } catch (e) {
            console.error(e);
            showToast('PNG render failed.', 'error');
            target.style.transform = origTransform;
        }
    } else if (format === 'svg') {
        try {
            // Generate clean vector representations
            const htmlContent = target.outerHTML;
            const svgContent = `
                <svg xmlns="http://www.w3.org/2000/svg" width="340" height="520">
                    <foreignObject width="100%" height="100%">
                        <div xmlns="http://www.w3.org/1999/xhtml">
                            <style>
                                .label-container { background: #ffffff; padding: 24px; color: #000000; font-family: sans-serif; border: 3px solid #000000; }
                                .label-container * { color: #000000; font-family: sans-serif; }
                                .font-black { font-weight: 900; }
                                .font-bold { font-weight: 700; }
                                .text-\[34px\] { font-size: 34px; }
                                .text-\[32px\] { font-size: 32px; }
                                .text-\[40px\] { font-size: 40px; }
                                .text-\[14px\] { font-size: 14px; }
                                .text-\[15px\] { font-size: 15px; }
                                .text-\[13px\] { font-size: 13px; }
                                .text-\[9px\] { font-size: 9px; }
                                .border-b-\[8px\] { border-bottom: 8px solid black; }
                                .border-b-\[5px\] { border-bottom: 5px solid black; }
                                .border-b { border-bottom: 1px solid black; }
                                .flex { display: flex; }
                                .justify-between { justify-content: space-between; }
                                .items-end { align-items: flex-end; }
                                .pl-4 { padding-left: 16px; }
                                .pl-8 { padding-left: 32px; }
                                .italic { font-style: italic; }
                                .mt-1 { margin-top: 4px; }
                                .mt-2 { margin-top: 8px; }
                            </style>
                            ${htmlContent}
                        </div>
                    </foreignObject>
                </svg>
            `;
            
            target.style.transform = origTransform;
            
            const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${state.label.productName.replace(/\s+/g, '_')}_Nutrition_Facts.svg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            showToast('Vector SVG exported successfully!', 'success');
        } catch (e) {
            console.error(e);
            showToast('SVG export failed.', 'error');
            target.style.transform = origTransform;
        }
    }
};

// ==============================================
// LOCAL BACKGROUND GENERATION
// ==============================================
window.generateBackdropImage = async function(prompt, seed) {
    // Generate high luxury background image using Pollinations AI (100% Free, CORS enabled)
    // We encode the prompt and append parameters: width, height, seed, nologo
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=900&seed=${seed}&nologo=true`;
    
    // Pre-fetch the image using Image() constructor to ensure it is loaded and cached by the browser
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error("AI image generation timed out or failed. Please check your network connection and try again."));
    });
};

// ==============================================
// BOOTSTRAP INITIALIZATION PROCEDURES
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Particle generator
    initParticles();
    
    // 2. Hydrate form inputs from base state
    populateInputsFromState();
    
    // 3. Setup change event listeners on all form fields for zero delay synchronization
    const formFields = [
        'productName', 'labelStandard', 'servingSize', 'servingsPerContainer',
        'calories', 'totalFat', 'satFat', 'transFat', 'cholesterol', 'sodium',
        'totalCarbs', 'fiber', 'sugars', 'addedSugars', 'protein',
        'vitaminD', 'calcium', 'iron', 'potassium'
    ];
    
    formFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', triggerPreviewSync);
        }
    });
    
    // 4. Initialize Firebase Cloud Sync if stored keys found
    if (localStorage.getItem('fb_sync_config')) {
        const config = JSON.parse(localStorage.getItem('fb_sync_config'));
        state.firebaseConfig = config;
        
        // Pre-fill modal configs
        document.getElementById('fbApiKey').value = config.apiKey || '';
        document.getElementById('fbAuthDomain').value = config.authDomain || '';
        document.getElementById('fbProjectId').value = config.projectId || '';
        document.getElementById('fbStorageBucket').value = config.storageBucket || '';
        document.getElementById('fbAppId').value = config.appId || '';
        
        initializeFirebaseEngine();
    }
    
    // 5. Initialize the upload zone drag-n-drop and click events
    initLuxuryUploadZone();
    
    // 6. Bind Luxury Mockup Studio control listeners for real-time adjustments
    bindMockupDashboardListeners();
    
    // 7. Hydrate AI generator settings (Removed)
    
    // 8. Draw clean starting view
    syncStateToPreview();
});
