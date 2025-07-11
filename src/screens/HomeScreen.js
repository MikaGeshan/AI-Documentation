import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import InputBox from '../components/InputBox';
import BubbleChat from '../components/BubbleChat';
import { deepSeekResponse } from '../services/deepSeekResponse';
import { getInitialGreeting } from '../utils/greetings';
import { useLoadingMessage } from '../hooks/loadingMessage';

const HomeScreen = () => {
  const { stage, startStage, resetStage, loadingMessage } = useLoadingMessage();
  const [messages, setMessages] = useState([]);

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

    const aiText = await deepSeekResponse(userText, {
      startStage,
      resetStage,
    });

    const aiMessage = {
      id: `ai-${Date.now()}`,
      text: aiText,
      sender: 'ai',
    };

    setMessages(prev => [...prev, aiMessage]);
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
      paddingHorizontal: 10,
      paddingVertical: 10,
      backgroundColor: '#EFEDEC',
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
    },
    infoText: {
      textAlign: 'center',
      fontSize: 12,
      color: '#B3B5B2',
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

            {loadingMessage && (
              <BubbleChat
                key="loading"
                message={loadingMessage}
                isUserChat={false}
              />
            )}
          </ScrollView>
          <View style={styles.inputBoxWrapper}>
            <InputBox onSend={handleSendMessage} />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              AI can make mistakes. Always verify the official documentation.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default HomeScreen;
