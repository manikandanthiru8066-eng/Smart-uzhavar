import React from 'react';
import { useAutoTranslate } from '../hooks/useAutoTranslate';

interface TranslatedTextProps {
  text?: string;
  taField?: string;
  className?: string;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ text, taField, className }) => {
  const translated = useAutoTranslate(text, taField);
  return <span className={className}>{translated}</span>;
};
