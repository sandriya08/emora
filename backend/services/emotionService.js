const { pipeline } = require('@xenova/transformers');

let classifier;

/**
 * Initialize the emotion classification pipeline.
 * This will download the model (~80MB) on the first run.
 */
async function initClassifier() {
    if (!classifier) {
        console.log('Loading Emotion Analysis Model (GoEmotions)...');
        classifier = await pipeline('text-classification', 'Xenova/roberta-base-go_emotions');
        console.log('Emotion Analysis Model Loaded Successfully.');
    }
}

/**
 * Maps GoEmotions (28 labels) to App-Specific Categories
 */
const CATEGORY_MAP = {
    // Anxiety
    'fear': 'Anxiety',
    'nervousness': 'Anxiety',
    'apprehension': 'Anxiety',
    
    // Depression
    'sadness': 'Depression',
    'grief': 'Depression',
    'disappointment': 'Depression',
    'remorse': 'Depression',
    
    // Stress / Burnout
    'anger': 'Stress',
    'annoyance': 'Stress',
    'disapproval': 'Stress',
    'confusion': 'Stress',
    
    // Low Self-Esteem
    'embarrassment': 'Low Self-Esteem',
    
    // Adjustment Issues
    'realization': 'Adjustment Issues',
    'surprise': 'Adjustment Issues'
};

/**
 * Analyzes a message and returns category scores.
 * @param {string} text The user message
 * @returns {Promise<Object>} Object with categories and scores
 */
async function analyzeEmotion(text) {
    await initClassifier();
    
    // Get top 5 emotions
    const results = await classifier(text, { topk: 5 });
    
    const categoryScores = {};
    
    results.forEach(res => {
        const category = CATEGORY_MAP[res.label];
        if (category) {
            // Combine scores if multiple labels map to same category
            categoryScores[category] = (categoryScores[category] || 0) + res.score;
        }
    });
    
    return categoryScores;
}

/**
 * Analyzes a full conversation and aggregates results.
 * @param {Array} messages Array of {text, sender} objects
 * @returns {Promise<Object>} Aggregated scores
 */
async function analyzeFullConversation(messages) {
    const userMessages = messages.filter(m => m.sender === 'user').map(m => m.text);
    const aggregate = {
        'Stress': 0,
        'Anxiety': 0,
        'Depression': 0,
        'Burnout': 0,
        'Sleep Disturbance': 0,
        'Low Self-Esteem': 0,
        'Emotional Exhaustion': 0,
        'Adjustment Issues': 0
    };
    
    for (const text of userMessages) {
        const scores = await analyzeEmotion(text);
        for (const [cat, score] of Object.entries(scores)) {
            if (aggregate[cat] !== undefined) {
                aggregate[cat] += score;
            }
        }
    }
    
    return aggregate;
}

module.exports = {
    analyzeEmotion,
    analyzeFullConversation
};
