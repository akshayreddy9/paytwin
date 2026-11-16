import { Dimensions, Platform } from 'react-native';

// In the browser preview the app lives in a phone-sized frame.
export const PHONE_WIDTH = 412;
// Sizes in the code were measured on a 412dp-wide screen; z() scales them to the real phone.
export const SCALE = Math.min(1, (Platform.OS === 'web' ? Math.min(Dimensions.get('window').width, PHONE_WIDTH) : Dimensions.get('window').width) / PHONE_WIDTH);
export const z = (n) => Math.round(n * SCALE * 2) / 2;

export const screenWidth = () => (Platform.OS === 'web' ? Math.min(Dimensions.get('window').width, PHONE_WIDTH) : Dimensions.get('window').width);

// Colours sampled from the reference recording.
export const C = {
  navy: '#0E4AA1', // round shortcut icons, primary buttons
  navyDeep: '#05234B', // bottom of the Scan QR pill
  navyText: '#0B2E6B', // logo navy
  cyan: '#00B9F1', // logo cyan, gradient tops
  link: '#2A6CBF', // "View All", "Change", "Copy"
  icon: '#1D4E9E', // thin line icons in grids
  mint: '#B8F2E8',
  mintText: '#2A6B5F',
  offer: '#D0F0F8',
  badge: '#F9D540',

  blue: '#0E4AA1',
  blueDark: '#0B3D86',
  blueSoft: '#E7F1FB',
  blueTint: '#CFE3F7',
  text: '#1D1D1D',
  muted: '#6B6B6B',
  faint: '#9A9A9A',
  line: '#EEEEEE',
  bg: '#FFFFFF',
  page: '#F5F5F7',
  surface: '#F3F5F8',
  green: '#21B573',
  greenSoft: '#E3F6EC',
  red: '#E5484D',
  redSoft: '#FDE7E8',
  pink: '#FFDADC',
  amber: '#B06000',
  amberSoft: '#FFF5D6',
  gYellow: '#F9D540',
  gRed: '#E5484D',
  gGreen: '#21B573',
  gBlue: '#0E4AA1',
};

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
};
