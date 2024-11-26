import express from "express";
import { Readable } from "node:stream";

const app = express()

app.post("/", express.json(), async (req, res) => {
  console.log('req.params: ', req.params)
  console.log('req.query: ', req.query)
  console.log('req.body: ', req.body)
  console.log('req.headers: ', req.headers)
  console.log('req.method: ', req.method)
  console.log('req.cookies: ', req.cookies)
  
  const messages = req.body.messages;
  console.log('messages:', messages)

  const query = messages[messages.length-1].content
  console.log('query:', query)
  // Use Copilot's LLM to generate a response to the user's messages, with
  // our extra system messages attached.
  const aionuLLMResponse = await fetch(
    "https://api.aionu.edu-tech.io/v1/chat-messages",
    {
      method: "POST",
      headers: {
        authorization: `Bearer app-6Ng3P3RlOfjClWjjnMmbNv61`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        "inputs": {},
        "query": `${query}`,  
        "response_mode": "blocking",  
        "conversation_id": "",  
        "user": "copilot"
    }),
    }
  );

  console.log('aionuLLMResponse:', aionuLLMResponse)

  // Stream the response straight back to the user.
  Readable.from(aionuLLMResponse.body).pipe(res);
})

const port = Number(process.env.PORT || '3000')
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
});