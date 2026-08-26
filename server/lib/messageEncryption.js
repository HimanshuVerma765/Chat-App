import crypto from "crypto";

const algorithm = "aes-256-gcm";

const getEncryptionKey = () => {
  const key = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!key || !/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY must be a 64-character hexadecimal key",
    );
  }
  return Buffer.from(key, "hex");
};

export const encryptMessage = (text) => {
  if (typeof text !== "string") return undefined;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(".");
};

export const decryptMessage = (encryptedText) => {
  if (!encryptedText) return undefined;

  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(".");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted message format");
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    getEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
};

export const toClientMessage = (message) => {
  const messageObject = message.toObject ? message.toObject() : { ...message };
  const { encryptedText, ...clientMessage } = messageObject;

  return {
    ...clientMessage,
    ...(encryptedText !== undefined
      ? { text: decryptMessage(encryptedText) }
      : {}),
  };
};
