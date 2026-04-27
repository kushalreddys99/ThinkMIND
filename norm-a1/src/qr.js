import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

function Qr() {
  const [text, setText] = useState('https://reactjs.org');

  return (
    <div style={{ padding: '20px' }}>
      <h3>QR Code Generator</h3>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter URL or text"
      />
      <div style={{ marginTop: '20px' }}>
       
        <QRCodeSVG value={text} size={256} />
      </div>
    </div>
  );
}

export default Qr;
