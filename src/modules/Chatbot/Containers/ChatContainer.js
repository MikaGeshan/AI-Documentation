import React, { useEffect } from 'react';
import ChatComponent from '../Components/ChatComponent';
import { useLoadingMessage } from '../../../hooks/ai/loadingMessage';
import { getInitialGreeting } from '../../../utils/greetings';
import { deepSeekResponse } from '../../../services/deepSeekResponse';
import { ChatStores } from '../Stores/ChatAction';

const ChatContainer = () => {
  const { startStage, resetStage, loadingMessage } = useLoadingMessage();
  const { messages, setMessages, addMessage } = ChatStores();

  useEffect(() => {
    const greeting = getInitialGreeting();
    setMessages([
      {
        id: 'init-ai-greeting',
        text: greeting,
        sender: 'ai',
      },
    ]);
  }, [setMessages]);

  const handleSendMessage = async userText => {
    const userMessage = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
    };
    addMessage(userMessage);

    const aiText = await deepSeekResponse(userText, {
      startStage,
      resetStage,
    });

    const aiMessage = {
      id: `ai-${Date.now()}`,
      text: aiText,
      sender: 'ai',
    };
    addMessage(aiMessage);
  };

  return (
    <ChatComponent
      messages={messages}
      loadingMessage={loadingMessage}
      onSendMessage={handleSendMessage}
    />
  );
};

export default ChatContainer;
