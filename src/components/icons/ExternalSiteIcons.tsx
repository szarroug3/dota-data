import React from "react";

export const DotabuffIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ef4444"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="#ef4444" fill="none" strokeWidth={2.5} />
    <text
      x="12"
      y="13.5"
      textAnchor="middle"
      fontSize="11"
      fill="#ef4444"
      fontFamily="Arial, sans-serif"
      dominantBaseline="middle"
      fontWeight="normal"
    >
      D
    </text>
  </svg>
);

export const OpenDotaIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="10" r="7" stroke="#000" className="dark:stroke-white" fill="none" strokeWidth={1.5} />
    <line x1="9" y1="1" x2="9" y2="19" stroke="#22c55e" strokeWidth={1.5} />
    <path d="M9 1 a8.5 8.5 0 0 1 0 18" stroke="#22c55e" fill="none" strokeWidth={1.5} />
  </svg>
);

export const StratzIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="27" fill="none" stroke="url(#circleOutline)" strokeWidth="6" />
    <path fillRule="evenodd" d="M56.72 30C56.72 15.253 44.747 3.28 30 3.28S3.279 15.253 3.279 30 15.252 56.721 30 56.721 56.72 44.748 56.72 30z" fill="none"></path>
    <path d="M39.071 36.287a.72.72 0 01.53.22c.146.147.22.324.22.532a.72.72 0 01-.22.531c-.147.146-.323.219-.53.219s-.385-.073-.532-.219a.72.72 0 01-.22-.531c0-.208.073-.385.22-.532s.324-.22.532-.22zm.001.118a.61.61 0 00-.635.634c0 .175.062.324.186.447a.61.61 0 00.449.185.609.609 0 00.446-.185.61.61 0 00.185-.447.61.61 0 00-.185-.448.609.609 0 00-.446-.185zm-.026.148c.111 0 .197.023.257.07s.091.11.091.19c0 .065-.021.121-.064.167s-.102.077-.178.093v.004c.053.012.105.071.158.177l.125.254h-.173l-.104-.229c-.053-.115-.109-.173-.17-.173h-.065v.402h-.146v-.955h.269zm-.029.124h-.094v.307h.118c.132 0 .198-.051.198-.154 0-.059-.018-.099-.053-.121s-.092-.032-.168-.032z" fill="url(#circledR)"/>
    <path d="M30.291 19.96l8.88 5.894v.723l-.603-.134-1.273 11.978s6.028 1.201 9.712 3.87c0 0-6.686-2.636-13.718-2.769V32.4h1.424l-4.42-3.303V19.96zm0-4.691l1.381 1.177v2.941l1.42 1.117.422-2.687 2.142 1.88v2.532l1.243.896.488-2.267 1.731 1.294-.4 2.875-8.427-5.816v-3.942z" fill="url(#rightCastle)"/>
    <path d="M29.727 19.96v9.136l-4.42 3.303h1.424v7.123c-7.032.134-13.718 2.769-13.718 2.769 3.684-2.669 9.711-3.87 9.711-3.87L21.45 26.444l-.602.134v-.723l8.879-5.894zm0-4.691v3.942l-8.428 5.816-.399-2.875 1.731-1.294.488 2.267 1.243-.896v-2.532l2.141-1.88.422 2.687 1.421-1.117v-2.941l1.381-1.177z" fill="url(#leftCastle)"/>
    <defs>
      <linearGradient id="circleOutline" x1="18.486" y1="30" x2="60.25" y2="59.097" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ea5e9"></stop>
        <stop offset="1" stopColor="#0369a1"></stop>
      </linearGradient>
      <linearGradient id="circledR" x1="38.319" y1="36.287" x2="39.821" y2="37.788" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8"></stop>
        <stop offset="1" stopColor="#0ea5e9"></stop>
      </linearGradient>
      <linearGradient id="rightCastle" x1="30.291" y1="15.269" x2="54.47" y2="30.225" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8"></stop>
        <stop offset="1" stopColor="#0ea5e9"></stop>
      </linearGradient>
      <linearGradient id="leftCastle" x1="18.162" y1="28.78" x2="32.737" y2="35.061" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ea5e9"></stop>
        <stop offset="1" stopColor="#0369a1"></stop>
      </linearGradient>
    </defs>
  </svg>
);

export const Dota2ProTrackerIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <mask id="aegis-cutout-mask">
        <rect width="32" height="32" fill="black"/>
        <circle cx="8" cy="23" r="6" fill="white"/>
        <circle cx="3.5" cy="27" r="2" fill="black"/>
        <circle cx="12.5" cy="27" r="2" fill="black"/>
        <path d="M6 22.5 l2 2 l3 -3" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </mask>
      <mask id="dota-logo-cutout-mask">
        <rect x="2" y="1" width="12" height="12" fill="white"/>
        <polygon points="2,1 5,1 14,10 14,13 11,13 2,4" fill="black"/>
        <polygon points="8,2 13,2 13,7" fill="black"/>
        <polygon points="3,12 8,12 3,7" fill="black"/>
      </mask>
    </defs>
    <rect x="2" y="1" width="12" height="12" stroke="#3b82f6" strokeWidth="2" fill="#3b82f6" mask="url(#dota-logo-cutout-mask)"/>
    <rect x="2" y="1" width="12" height="12" fill="none" stroke="#3b82f6" strokeWidth="2" pointerEvents="none"/>
    <text x="24" y="8.5" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="18" fill="#3b82f6" textAnchor="middle" dominantBaseline="middle">2</text>
    <g>
      <circle cx="8" cy="23" r="6" fill="#3b82f6" mask="url(#aegis-cutout-mask)"/>
    </g>
    <text x="24" y="24" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" fill="#3b82f6" textAnchor="middle" dominantBaseline="middle">T</text>
  </svg>
); 