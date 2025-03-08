import stream from "stream";

// Convert buffer to readable stream
const bufferToStream = (buffer) => {
  const readable = new stream.Readable();
  readable._read = () => {}; // _read is required but no-op
  readable.push(buffer);
  readable.push(null); // End of stream
  return readable;
};

export default bufferToStream;
