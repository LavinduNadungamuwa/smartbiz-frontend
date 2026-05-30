import { useContext } from 'react';
import AuthContext from './authContextValue';

export default function useAuth() {
  return useContext(AuthContext);
}
