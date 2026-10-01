const authService = require("../services/auth.service");
const reservationService = require("../services/reservation.service");

async function google(req, res, next) {
  try {
    const result = await authService.signInWithGoogle(req.body.credential);
    res.cookie("hotel_token", result.token, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({ data: result.user });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginLocal(req.body);
    res.cookie("hotel_token", result.token, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({ data: result.user });
  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
  try {
    const user = await authService.registerClient(req.body);
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  res.json({ data: { id: req.user.sub, name: req.user.name, email: req.user.email, role: req.user.role } });
}

async function session(req, res, next) {
  try {
    const reservations = await reservationService.getAll(req.user);
    res.json({
      data: {
        user: { id: req.user.sub, name: req.user.name, email: req.user.email, role: req.user.role },
        reservations,
      },
    });
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  res.clearCookie("hotel_token");
  res.status(204).send();
}

module.exports = { google, register, login, me, session, logout };
