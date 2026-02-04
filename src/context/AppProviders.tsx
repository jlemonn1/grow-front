import { ReactNode } from 'react';
import { UIContextProvider } from './ui.context';
import { AuthProvider } from './auth.context';
import { VisitorProvider } from './visitor.context';
import { ConfigProvider } from './config.context';
import { DemoProvider } from './demo.context';
import { ProductsProvider } from './products.context';
import { CustomersContextProvider } from './customers.context';
import { TicketProvider } from './ticket.context';
import { ReportsProvider } from './reports.context';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <UIContextProvider>
      <VisitorProvider>
        <AuthProvider>
          <ConfigProvider>
            <DemoProvider>
              <ReportsProvider>
                <ProductsProvider>
                  <CustomersContextProvider>
                    <TicketProvider>
                      {children}
                    </TicketProvider>
                  </CustomersContextProvider>
                </ProductsProvider>
              </ReportsProvider>
            </DemoProvider>
          </ConfigProvider>
        </AuthProvider>
      </VisitorProvider>
    </UIContextProvider>
  );
}
