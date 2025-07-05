import { Alert } from 'react-native';

export default function FutureImplementationAlert() {
  return Alert.alert(
    'Em breve!',
    'Essa função estará disponível nas próximas versões.'
  );
}
