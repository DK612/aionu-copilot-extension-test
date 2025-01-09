import express from "express";
import { Readable } from "node:stream";

const app = express();
const decoder = new TextDecoder("utf-8");

app.post("/", express.json(), async (req, res) => {
  //console.log('req.params: ', req.params)
  //console.log('req.query: ', req.query)
  console.log('req.body: ', req.body)
  console.log('req.body: ', JSON.stringify(req.body))
  console.log('req.headers: ', req.headers)
  console.log('req.method: ', req.method)
  console.log('req.cookies: ', req.cookies)
  
  const messages = req.body.messages;
  console.log('messages:', messages)

  const query = messages[messages.length-1].content
  console.log('query:', query)
  // Use Copilot's LLM to generate a response to the user's messages, with
  // our extra system messages attached.
    try {
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
                    "response_mode": "streaming",
                    "conversation_id": "",
                    "user": "copilot"
                }),
            }
        );

        if(aionuLLMResponse.status !== 200) {
            throw new Error(await aionuLLMResponse.text());
        }

        if (!aionuLLMResponse.body) {
            throw new Error(`No response body returned.`);
        }

        const stream = aionuLLMResponse.body;
        
        // 스트림 처리
        for await (const chunk of stream) {
            const decodedChunk = decoder.decode(chunk);
            try {
                const jsonStr = decodedChunk.replace('data: ', '');
                const jsonData = JSON.parse(jsonStr);
                
                if (jsonData.answer) {
                    const openAIFormat = {
                        id: 'chatcmpl-' + Math.random().toString(36).substring(2, 12),
                        object: 'chat.completion.chunk',
                        created: Math.floor(Date.now() / 1000),
                        model: 'gpt-4o',
                        choices: [{
                            index: 0,
                            delta: {
                                content: jsonData.answer
                            },
                            finish_reason: null
                        }]
                    };
                    if(openAIFormat) {
                      console.log('openAIFormat : ', openAIFormat)
                      console.log('jsonData.answer : ', jsonData.answer)
                      res.write('data: ' + JSON.stringify(openAIFormat) + '\n\n');
                    }
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        }
        
        // 스트림 종료 시그널 전송
        const finalMessage = {
          id: 'chatcmpl-' + Math.random().toString(36).substring(2, 12),
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'gpt-3.5-turbo',
          choices: [{
              index: 0,
              delta: {
                content: ''
              },
              finish_reason: 'stop'
          }]
        };
        res.write('data: ' + JSON.stringify(finalMessage) + '\n\n');
        //res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Error:', error);
        //res.status(500).json({ error: 'Internal Server Error' });
    }
});

const port = Number(process.env.PORT || '3000');
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});