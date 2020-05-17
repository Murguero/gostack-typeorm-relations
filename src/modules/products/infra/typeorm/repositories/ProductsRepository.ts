import { getRepository, Repository, In } from 'typeorm';
import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productId = products.map(product => product.id);

    const product = await this.ormRepository.find({ id: In(productId) });

    if (productId.length !== product.length) {
      throw new AppError('Missing Product');
    }

    return product;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const allProducts = await this.findAllById(products);

    const orderProducts = allProducts.map(product => {
      const oneProduct = products.find(
        correctProdut => correctProdut.id === product.id,
      );

      if (!oneProduct) {
        throw new AppError('Product not find');
      }

      const newProduct = product;

      if (newProduct.quantity < oneProduct.quantity) {
        throw new AppError('Insufficient product quantity');
      }

      newProduct.quantity -= oneProduct.quantity;

      return newProduct;
    });

    await this.ormRepository.save(orderProducts);

    return orderProducts;
  }
}

export default ProductsRepository;
