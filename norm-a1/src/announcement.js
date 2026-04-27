import React, { useState, useRef, useEffect } from "react";
import "./announcement.css";

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { text: "Hi  How can I help you?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botReply = {
        text: getBotResponse(input),
        sender: "bot",
      };
      setMessages((prev) => [...prev, botReply]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (msg) => {
    msg = msg.toLowerCase();

    if (msg.includes("hello")) return "Hey there! ";
    if (msg.includes("help")) return "I’m here to help!";
    if (msg.includes("price")) return "Pricing depends on your needs.";
    return "I’m still learning ";
  };

  return (
    <div className="chat-container">
      
      <div className="chat-header">AI Chatbot</div>

      <div className="chat-body">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${
              msg.sender === "user" ? "user" : "bot"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {isTyping && <div className="typing">Bot is typing...</div>}

        <div ref={chatEndRef}></div>
      </div>

      <div className="chat-footer">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

    </div>
  );
};

export default ChatBot;