const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/user.repository");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  async registerClient({ name, email, password }) {
    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");
    if (normalizedName.length < 2 || normalizedName.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw this.error("Ingresa un nombre y correo válidos", 400);
    }
    if (normalizedPassword.length < 6) {
      throw this.error("La contraseña debe tener al menos 6 caracteres", 400);
    }
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",")
      .map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (await userRepository.findByEmail(normalizedEmail)) {
      throw this.error("Este correo ya está registrado", 409);
    }
    const passwordHash = await bcrypt.hash(normalizedPassword, 10);
    const user = await userRepository.create({
      name: normalizedName,
      email: normalizedEmail,
      password: passwordHash,
      role: adminEmails.includes(normalizedEmail) ? "admin" : "user",
    });
    return this.publicUser(user);
  }

  async loginLocal({ email, password }) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");
    if (!normalizedEmail || !normalizedPassword) {
      throw this.error("Ingresa tu correo y contraseña", 400);
    }
    const user = await userRepository.findByEmailWithPassword(normalizedEmail);
    if (!user || !user.password) {
      throw this.error("Correo o contraseña incorrectos", 401);
    }
    const matches = await bcrypt.compare(normalizedPassword, user.password);
    if (!matches) {
      throw this.error("Correo o contraseña incorrectos", 401);
    }
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",")
      .map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes(normalizedEmail) && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }
    return { user: this.publicUser(user), token: this.issueToken(user) };
  }

  issueToken(user) {
    return jwt.sign(
      { sub: user._id.toString(), role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );
  }

  async signInWithGoogle(credential) {
    if (!credential || !process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      throw this.error("Google authentication is not configured", 503);
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw this.error("Google account is not verified", 401);
    }
    const email = payload.email.toLowerCase();
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",")
      .map((value) => value.trim().toLowerCase()).filter(Boolean);
    const user = await userRepository.upsertGoogleUser({
      googleId: payload.sub,
      name: payload.name || email,
      email,
      picture: payload.picture || "",
      role: adminEmails.includes(email) ? "admin" : "user",
    });
    return {
      user: this.publicUser(user),
      token: this.issueToken(user),
    };
  }

  verifyToken(token) {
    if (!token || !process.env.JWT_SECRET) throw this.error("Authentication required", 401);
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  publicUser(user) {
    return { id: user._id, name: user.name, email: user.email, picture: user.picture, role: user.role };
  }

  error(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }
}

module.exports = new AuthService();
