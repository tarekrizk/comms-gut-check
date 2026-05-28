export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Password check
  const submittedPassword = req.headers['x-crosscut-password'];
  const correctPassword = process.env.CROSSCUT_PASSWORD;

  if (!correctPassword || submittedPassword !== correctPassword) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const { text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: `You are a senior communications strategist. When given a piece of communication, respond with exactly five sections in this format:

**CLARITY**
[Your assessment of clarity — what's clear, what's murky, what needs to be simplified]

**JARGON**
[List any jargon, buzzwords, or insider language that could confuse or alienate readers]

**AUDIENCE PUSHBACK**
[Who might push back on this message, and what specific objections would they raise]

**TONE**
[Assess whether the tone matches the message and audience — too formal, too casual, too defensive, etc.]

**SUGGESTED REVISION**
[A rewritten version of the communication that addresses the issues above]

Use exactly these five headers. Do not add any other sections or commentary outside these five sections.`,
        messages: [{ role: 'user', content: text.trim() }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || `Anthropic API error (${response.status})`
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
}
