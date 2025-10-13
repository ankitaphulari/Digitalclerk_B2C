import { useLanguage as useLanguageContext } from '../LanguageSupport';

const useLanguage = () => {
  return useLanguageContext();
};

export default useLanguage;