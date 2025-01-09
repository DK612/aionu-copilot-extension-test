from flask import Flask, request, Response, stream_with_context
import json
import requests
import os
import time

app = Flask(__name__)

@app.route('/code-assistant', methods=['POST'])
def handle_request():
    # 요청 데이터 로깅
    print('req.body:', request.json)
    print('req.body:', json.dumps(request.json))
    print('req.headers:', dict(request.headers))
    print('req.method:', request.method)
    
    messages = request.json.get('messages', [])
    print('messages:', messages)
    
    query = messages[-1]['content']
    print('query:', query)
    
    def generate():
        try:
            response = requests.post(
                "https://api.aionu.edu-tech.io/v1/chat-messages",
                headers={
                    'authorization': 'Bearer app-6Ng3P3RlOfjClWjjnMmbNv61',
                    'content-type': 'application/json'
                },
                json={
                    "inputs": {},
                    "query": query,
                    "response_mode": "streaming",
                    "conversation_id": "",
                    "user": "copilot"
                },
                stream=True
            )
            
            if response.status_code != 200:
                raise Exception(response.text)
                
            for line in response.iter_lines():
                if line:
                    try:
                        decoded_line = line.decode('utf-8').replace('data: ', '')
                        json_data = json.loads(decoded_line)
                        
                        if json_data.get('answer'):
                            openai_format = {
                                'id': f'chatcmpl-{os.urandom(5).hex()}',
                                'object': 'chat.completion.chunk',
                                'created': int(time.time()),
                                'model': '',
                                'choices': [{
                                    'index': 0,
                                    'delta': {
                                        'content': json_data['answer']
                                    },
                                    'finish_reason': None
                                }]
                            }
                            
                            print('openAIFormat:', openai_format)
                            print('jsonData.answer:', json_data['answer'])
                            yield f'data: {json.dumps(openai_format)}\n\n'
                            
                    except json.JSONDecodeError as e:
                        print('Error parsing JSON:', e)
            
            # 스트림 종료 시그널
            final_message = {
                'id': f'chatcmpl-{os.urandom(5).hex()}',
                'object': 'chat.completion.chunk',
                'created': int(time.time()),
                'model': '',
                'choices': [{
                    'index': 0,
                    'delta': {
                        'content': ''
                    },
                    'finish_reason': 'stop'
                }]
            }
            yield f'data: {json.dumps(final_message)}\n\n'
            
        except Exception as e:
            print('Error:', e)
            
    return Response(stream_with_context(generate()), mimetype='text/event-stream')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(port=port)