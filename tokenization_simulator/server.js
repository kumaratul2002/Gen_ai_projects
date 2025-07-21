
import express from 'express';
import { get_encoding} from 'tiktoken';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.'));

app.post('/', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    const enc = get_encoding("gpt2");
    
    // Encode text to get token IDs
    const tokensRaw = enc.encode(text);
    const tokens = Array.from(tokensRaw); // Convert to regular array
    
    const tokenDetails = tokens.map((tokenId, index) => {
      try {
        const tokenBytes = enc.decode([tokenId]);
        const allDecoded = enc.decode(tokens);  //decode all tokens at once, then split
        console.log("allDecoded", allDecoded);
        // For individual tokens, try different approaches
        let tokenText;
        try {
          if (tokenBytes instanceof Uint8Array) {
            tokenText = new TextDecoder().decode(tokenBytes);
          } else if (typeof tokenBytes === 'string') {
            tokenText = tokenBytes;
          } else {
            // Fallback: convert to string
            tokenText = String.fromCharCode(...tokenBytes);
          }
        } catch (e) {
          console.log('Error converting token:', e);
          tokenText = '[DECODE_ERROR]';
        }
        console.log(`tokenText ${index}: "${tokenText}"`);
        return {
          id: tokenId,
          text: tokenText,
          displayText: tokenText.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/ /g, '·')
        };
      } catch (error) {
        return {
          id: tokenId,
          text: '[ERROR]',
          displayText: '[ERROR]'
        };
      }
    });
    
    enc.free();
    
    res.json({
      success: true,
      text: text,
      tokens: tokens,
      tokenDetails: tokenDetails,
      count: tokens.length
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to tokenize text' });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
}); 