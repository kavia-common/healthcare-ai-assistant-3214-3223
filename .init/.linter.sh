#!/bin/bash
cd /home/kavia/workspace/code-generation/healthcare-ai-assistant-3214-3223/chat_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

