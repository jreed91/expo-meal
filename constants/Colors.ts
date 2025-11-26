// Anthropic-inspired warm color palette
const tintColorLight = '#FF7A55'; // primary-500
const tintColorDark = '#FFB399'; // primary-300

export default {
  light: {
    text: '#1C1917', // neutral-900
    background: '#FAF8F5', // cream-100
    tint: tintColorLight,
    tabIconDefault: '#A8A29E', // neutral-400
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FAFAF9', // neutral-50
    background: '#1C1917', // neutral-900
    tint: tintColorDark,
    tabIconDefault: '#78716C', // neutral-500
    tabIconSelected: tintColorDark,
  },
};
