import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

// Os números do app são formatados em pt-BR. O main.ts registra o locale no
// boot da aplicação, mas os testes não passam por ele: sem este registro,
// qualquer componente com DecimalPipe quebra com NG0701.
registerLocaleData(localePt);
