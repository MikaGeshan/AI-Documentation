import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import InputBox from '../components/InputBox';
import BubbleChat from '../components/BubbleChat';
import { deepSeekResponse } from '../services/deepSeekResponse';
import { getInitialGreeting } from '../utils/greetings';

const HomeScreen = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const greeting = getInitialGreeting();
    const greetingMessage = {
      id: 'init-ai-greeting',
      text: greeting,
      sender: 'ai',
    };
    setMessages([greetingMessage]);
  }, []);

  const handleSendMessage = async userText => {
    const userMessage = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const aiText = await deepSeekResponse(userText);

    const aiMessage = {
      id: (Date.now() + 1).toString(),
      text: aiText,
      sender: 'ai',
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#EFEDEC',
    },
    scrollView: {
      flex: 1,
      padding: 4,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    inputBoxWrapper: {
      padding: 10,
      paddingBottom: 20,
      backgroundColor: '#EFEDEC',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map(msg => (
              <BubbleChat
                key={msg.id}
                message={msg.text}
                isUserChat={msg.sender === 'user'}
              />
            ))}

            {isLoading && (
              <BubbleChat key="loading" message="..." isUserChat={false} />
            )}
          </ScrollView>
          <View style={styles.inputBoxWrapper}>
            <InputBox onSend={handleSendMessage} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default HomeScreen;
