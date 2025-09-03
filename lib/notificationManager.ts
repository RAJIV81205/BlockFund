import toast from 'react-hot-toast';


interface Data {
  backer?: string;
  campaignAddress?: string;
  amount?: string | number;
  tierIndex?: string | number;
  newState?: number;
  name?: string;
  index?: string | number;
  owner?: string;
  paused?: boolean;
  newDeadline?: string | number | Date;
}

class NotificationManager {
  private recentNotifications = new Map<string, number>();
  private readonly DUPLICATE_WINDOW = 3000; // 3 seconds

  private generateEventId(type: string, data: Data, campaignAddress?: string): string {
    switch (type) {
      case 'campaign_created':
        return `${type}_${data.campaignAddress}`;
      case 'campaign_funded':
        return `${type}_${campaignAddress}_${data.backer}_${data.amount}_${data.tierIndex}`;
      case 'campaign_state_changed':
        return `${type}_${campaignAddress}_${data.newState}`;
      case 'tier_added':
        return `${type}_${campaignAddress}_${data.name}_${data.amount}`;
      case 'tier_removed':
        return `${type}_${campaignAddress}_${data.index}`;
      case 'funds_withdrawn':
        return `${type}_${campaignAddress}_${data.owner}_${data.amount}`;
      case 'refund_issued':
        return `${type}_${campaignAddress}_${data.backer}_${data.amount}`;
      case 'campaign_paused':
        return `${type}_${campaignAddress}_${data.paused}`;
      case 'deadline_extended':
        return `${type}_${campaignAddress}_${data.newDeadline}`;
      case 'details_updated':
        return `${type}_${campaignAddress}_${data.name}`;
      case 'campaign_deleted':
        return `${type}_${campaignAddress}`;
      case 'emergency_withdraw':
        return `${type}_${campaignAddress}_${data.owner}_${data.amount}`;
      default:
        return `${type}_${campaignAddress || 'unknown'}_${Date.now()}`;
    }
  }

  private isDuplicate(eventId: string): boolean {
    const now = Date.now();
    const lastNotification = this.recentNotifications.get(eventId);

    if (lastNotification && (now - lastNotification) < this.DUPLICATE_WINDOW) {
      return true;
    }

    this.recentNotifications.set(eventId, now);
    return false;
  }

  private cleanup() {
    const now = Date.now();
    for (const [eventId, timestamp] of this.recentNotifications.entries()) {
      if (now - timestamp > this.DUPLICATE_WINDOW * 2) {
        this.recentNotifications.delete(eventId);
      }
    }
  }

  private formatAddress(address?: string): string {
    if (!address) return 'Unknown Contract';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  private createNotificationContent(contractAddress: string, message: string): string {
    return `Contract: ${this.formatAddress(contractAddress)}\n${message}`;
  }

  showNotification(type: string, data: Data, campaignAddress?: string) {
    const eventId = this.generateEventId(type, data, campaignAddress);

    if (this.isDuplicate(eventId)) {
      console.log(`Duplicate notification blocked: ${eventId}`);
      return;
    }

    console.log(`Showing notification: ${eventId}`);

    const address = campaignAddress || data.campaignAddress || 'Unknown';

    switch (type) {
      case 'campaign_created':
        toast.success(this.createNotificationContent(address, `New campaign created: ${data.name}`));
        break;

      case 'campaign_funded':
        toast.success(this.createNotificationContent(address, `Campaign funded with ${data.amount} ETH!`));
        break;

      case 'campaign_state_changed':
        if (data.newState === 1) {
          toast.success(this.createNotificationContent(address, `Campaign reached its goal and is now Successful!`));
        } else if (data.newState === 2) {
          toast.error(this.createNotificationContent(address, `Campaign has Failed`));
        }
        break;

      case 'tier_added':
        toast.success(this.createNotificationContent(address, `New tier added: ${data.name} (${data.amount} ETH)`));
        break;

      case 'tier_removed':
        toast(this.createNotificationContent(address, `Tier removed from campaign`));
        break;

      case 'funds_withdrawn':
        toast.success(this.createNotificationContent(address, `Campaign owner withdrew ${data.amount} ETH`));
        break;

      case 'refund_issued':
        toast(this.createNotificationContent(address, `Refund issued: ${data.amount} ETH`));
        break;

      case 'campaign_paused':
        if (data.paused) {
          toast(this.createNotificationContent(address, `Campaign has been paused`));
        } else {
          toast.success(this.createNotificationContent(address, `Campaign has been resumed`));
        }
        break;

      case 'deadline_extended':
        if (typeof data.newDeadline === 'number') {
          const newDate = new Date(data.newDeadline * 1000);
          toast(this.createNotificationContent(address, `Campaign deadline extended to ${newDate.toLocaleDateString()}`));
        } else {
          console.warn('Invalid newDeadline received for deadline_extended notification:', data.newDeadline);
        }
        break;

      case 'details_updated':
        toast(this.createNotificationContent(address, `Campaign details updated: ${data.name}`));
        break;

      case 'campaign_deleted':
        toast.error(this.createNotificationContent(address, `Campaign has been deleted`));
        break;

      case 'emergency_withdraw':
        toast.error(this.createNotificationContent(address, `Emergency withdrawal: ${data.amount} ETH`));
        break;

      default:
        console.warn(`Unknown notification type: ${type}`);
    }

    // Cleanup old notifications periodically
    if (this.recentNotifications.size > 100) {
      this.cleanup();
    }
  }

  clearAll() {
    this.recentNotifications.clear();
  }

  getStats() {
    return {
      recentNotifications: this.recentNotifications.size,
      duplicateWindow: this.DUPLICATE_WINDOW
    };
  }
}

export const notificationManager = new NotificationManager();
