// ponytail: 1 poin per Rp 1.000 dari net (subtotal - diskon, sebelum pajak); parameter via Setting bila perlu

export const POINT_RP = 100; // 1 poin = Rp 100 saat ditukar
export const pointsToRp = (points: number): number => Math.max(0, points) * POINT_RP;

// Poin maksimum yang bisa dipakai: dibatasi permintaan, saldo, dan nilai belanja (redeem tak boleh melebihi net).
export const usablePoints = (requested: number, balance: number, net: number): number =>
  Math.max(0, Math.min(requested, balance, Math.floor(net / POINT_RP)));
export const loyaltyPoints = (net: number): number => Math.max(0, Math.floor(net / 1000));
