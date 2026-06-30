import { DashboardRepository } from '../repositories/dashboardRepository.js';

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getStats() {
    return this.dashboardRepository.getStats();
  }

  async getRecentOrders(limit = 8) {
    return this.dashboardRepository.getRecentOrders(limit);
  }

  async getLowStock(limit = 5) {
    return this.dashboardRepository.getLowStock(limit);
  }

  async getTopServices(limit = 5) {
    return this.dashboardRepository.getTopServices(limit);
  }
}
