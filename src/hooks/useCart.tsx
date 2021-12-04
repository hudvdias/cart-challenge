import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    };
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const alreadyInCart = cart.find((product) => product.id === productId);
      if (alreadyInCart) {
        const { data } = await api.get<Stock>(`/stock/${productId}`);
        if (data.amount <= alreadyInCart.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        };
        const updatedCart = cart.map((product) => {
          if (product.id === productId) {
            product.amount += 1;
          };
          return product;
        });
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        return;
      };
      const { data } = await api.get<Product>(`/products/${productId}`);
      const updatedCart = [...cart, { ...data, amount: 1 }];
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      return;
    } catch (error) {
      toast.error('Erro na adição do produto');
      return;
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const alreadyInCart = cart.find((product) => product.id === productId);
      if (!alreadyInCart) throw new Error();
      const updatedCart = cart.filter((product) => product.id !== productId);
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      return;
    } catch {
      toast.error('Erro na remoção do produto');
      return;
    };
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const alreadyInCart = cart.find((product) => product.id === productId);
      if (!alreadyInCart) throw new Error();
      if (alreadyInCart.amount === 0) return;
      if (amount < alreadyInCart.amount && alreadyInCart.amount === 1) return;
      if (amount > alreadyInCart.amount) {
        const { data } = await api.get<Stock>(`/stock/${productId}`);
        if (alreadyInCart.amount >= data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        };
      };
      const updatedCart = cart.map((product) => {
        if (product.id === productId) {
          product.amount = amount;
        };
        return product;
      });
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      return;
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
      return;
    };
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
