import { store } from '../../database/store';
import { Service } from '../../core/types';
import { BadRequestError, NotFoundError } from '../../core/errors/app-error';

export interface CreateServiceDTO {
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
  category?: string;
  badge?: string;
  icon?: string;
}

export interface UpdateServiceDTO {
  name?: string;
  durationMinutes?: number;
  price?: number;
  description?: string;
  category?: string;
  badge?: string;
  icon?: string;
  isActive?: boolean;
}

export class ServicesService {
  public static getAll(includeInactive = false): Service[] {
    if (includeInactive) {
      return [...store.services];
    }
    return store.services.filter((s) => s.isActive);
  }

  public static getAllActive(): Service[] {
    return store.services.filter((s) => s.isActive);
  }

  public static getById(id: string): Service {
    const srv = store.findServiceById(id);
    if (!srv) {
      throw new NotFoundError(`Servicio con ID ${id} no encontrado`);
    }
    return srv;
  }

  public static create(data: CreateServiceDTO): Service {
    const { name, durationMinutes, price, description, category, badge, icon } = data;

    if (!name || !name.trim()) {
      throw new BadRequestError('El nombre del corte es obligatorio');
    }

    const dur = Number(durationMinutes);
    if (isNaN(dur) || dur < 5 || dur > 360) {
      throw new BadRequestError('La duración debe ser un número entre 5 y 360 minutos');
    }

    const prc = Number(price);
    if (isNaN(prc) || prc < 0) {
      throw new BadRequestError('El precio debe ser un número válido mayor o igual a 0');
    }

    const newService: Service = {
      id: `srv-${Date.now()}`,
      tenantId: store.getPrimaryTenant().id,
      name: name.trim(),
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'Corte',
      badge: badge ? badge.trim() : undefined,
      icon: icon ? icon.trim() : 'fa-scissors',
      durationMinutes: dur,
      price: prc,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.services.push(newService);
    store.persist();
    return newService;
  }

  public static update(id: string, data: UpdateServiceDTO): Service {
    const srv = store.findServiceById(id);
    if (!srv) {
      throw new NotFoundError(`Servicio con ID ${id} no encontrado`);
    }

    if (data.name !== undefined) {
      if (!data.name.trim()) throw new BadRequestError('El nombre no puede estar vacío');
      srv.name = data.name.trim();
    }

    if (data.durationMinutes !== undefined) {
      const dur = Number(data.durationMinutes);
      if (isNaN(dur) || dur < 5) throw new BadRequestError('Duración inválida');
      srv.durationMinutes = dur;
    }

    if (data.price !== undefined) {
      const prc = Number(data.price);
      if (isNaN(prc) || prc < 0) throw new BadRequestError('Precio inválido');
      srv.price = prc;
    }

    if (data.description !== undefined) {
      srv.description = data.description.trim();
    }

    if (data.category !== undefined) {
      srv.category = data.category.trim();
    }

    if (data.badge !== undefined) {
      srv.badge = data.badge ? data.badge.trim() : undefined;
    }

    if (data.icon !== undefined) {
      srv.icon = data.icon.trim();
    }

    if (data.isActive !== undefined) {
      srv.isActive = Boolean(data.isActive);
    }

    srv.updatedAt = new Date();
    store.persist();
    return srv;
  }

  public static toggle(id: string): Service {
    const srv = store.findServiceById(id);
    if (!srv) {
      throw new NotFoundError(`Servicio con ID ${id} no encontrado`);
    }

    srv.isActive = !srv.isActive;
    srv.updatedAt = new Date();
    store.persist();
    return srv;
  }

  public static delete(id: string): boolean {
    const srv = store.findServiceById(id);
    if (!srv) {
      throw new NotFoundError('Servicio no encontrado');
    }

    srv.isActive = false;
    srv.updatedAt = new Date();
    store.persist();
    return true;
  }
}

export default ServicesService;
