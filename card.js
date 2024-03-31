const { pool } = require("./dbConfig.js");

// Maintain a list of all main words in the database
let allMainWords = [];

// Keep track of shown main words
let shownMainWords = [];

async function getRandomCardWithForbiddenWords() {
    try {
        // If all main words have been shown, reset the list of shown main words
        if (shownMainWords.length === allMainWords.length) {
            shownMainWords = [];
        }

        // Select a random main word that has not been shown
        let mainWord;
        do {
            mainWord = allMainWords[Math.floor(Math.random() * allMainWords.length)];
        } while (shownMainWords.includes(mainWord));

        // Mark the main word as shown
        shownMainWords.push(mainWord);

        // Query to fetch the main word and its associated forbidden words
        const query = `
            SELECT main_word, forbidden_words
            FROM taboo_cards
            WHERE main_word = $1
        `;
        const result = await pool.query(query, [mainWord]);

        // Extract the main word and forbidden words from the result
        const { main_word, forbidden_words } = result.rows[0];

        // Shuffle the forbidden words array
        const shuffledForbiddenWords = shuffleArray(forbidden_words);

        // Select the first 6 shuffled forbidden words
        const selectedForbiddenWords = shuffledForbiddenWords.slice(0, 6);

        return { main_word, forbidden_words: selectedForbiddenWords };
    } catch (error) {
        console.error('Error fetching card:', error);
        throw error;
    }
}

// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to initialize the list of all main words
async function initializeMainWords() {
    try {
        const query = 'SELECT DISTINCT main_word FROM taboo_cards';
        const result = await pool.query(query);
        allMainWords = result.rows.map(row => row.main_word);
    } catch (error) {
        console.error('Error initializing main words:', error);
        throw error;
    }
}

// Initialize the list of all main words
initializeMainWords();



async function addCard(mainWord, forbiddenWords) {
    const client = await pool.connect();
    try {
        if (forbiddenWords.length === 0) {
            throw new Error("Forbidden words array cannot be empty");
        }

        // Check if a card with the main word already exists
        const checkQuery = "SELECT id FROM taboo_cards WHERE main_word = $1";
        const checkResult = await client.query(checkQuery, [mainWord]);
        if (checkResult.rows.length > 0) {
            throw new Error("A card with this main word already exists");
        }

        await client.query('BEGIN');

        // Insert the main word into the database
        const mainWordQuery = "INSERT INTO taboo_cards (main_word, forbidden_words) VALUES ($1, $2) RETURNING id";
        const mainWordResult = await client.query(mainWordQuery, [mainWord, forbiddenWords]);
        const cardId = mainWordResult.rows[0].id;

        await client.query('COMMIT');
        return cardId;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error adding card:", error.message);
        throw error;
    } finally {
        client.release();
    }
}


module.exports = { getRandomCardWithForbiddenWords, addCard };