import { useState } from 'react';

export const useVisiblePassword = () => {
  const [visible, setVisible] = useState(false);
  const toggle = () => setVisible(prev => !prev);
  return [visible, toggle];
};
