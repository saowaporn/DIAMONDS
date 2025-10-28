// Guest Session Management
class GuestSessionManager {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3000/api';
    this.sessionId = null;
    this.init();
  }

  async init() {
    // ตรวจสอบว่ามี session ที่เก็บไว้ใน localStorage หรือไม่
    const storedSessionId = localStorage.getItem('guest_session_id');
    
    if (storedSessionId) {
      // ตรวจสอบว่า session ยังใช้งานได้หรือไม่
      const isValid = await this.validateSession(storedSessionId);
      if (isValid) {
        this.sessionId = storedSessionId;
        console.log('Existing guest session restored:', this.sessionId);
        return;
      } else {
        localStorage.removeItem('guest_session_id');
      }
    }
    
    // สร้าง session ใหม่
    await this.createNewSession();
  }

  async createNewSession() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/guest/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.sessionId = data.data.sessionId;
        localStorage.setItem('guest_session_id', this.sessionId);
        console.log('New guest session created:', this.sessionId);
      } else {
        console.error('Failed to create guest session');
      }
    } catch (error) {
      console.error('Error creating guest session:', error);
    }
  }

  async validateSession(sessionId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/guest/session/${sessionId}`);
      return response.ok;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  async extendSession() {
    if (!this.sessionId) return false;

    try {
      const response = await fetch(`${this.apiBaseUrl}/guest/session/${this.sessionId}/extend`, {
        method: 'PUT'
      });

      if (response.ok) {
        console.log('Guest session extended');
        return true;
      }
    } catch (error) {
      console.error('Error extending session:', error);
    }
    return false;
  }

  getSessionId() {
    return this.sessionId;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Guest-Session-ID': this.sessionId
    };
  }
}

// Order Management
class OrderManager {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
    this.apiBaseUrl = 'http://localhost:3000/api';
  }

  async createOrder(orderData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/orders`, {
        method: 'POST',
        headers: this.sessionManager.getHeaders(),
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Order created successfully:', result.data);
        return { success: true, data: result.data };
      } else {
        console.error('Failed to create order:', result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async getOrders() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/orders`, {
        headers: this.sessionManager.getHeaders()
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, data: result.data };
      } else {
        console.error('Failed to fetch orders:', result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async getOrder(orderId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
        headers: this.sessionManager.getHeaders()
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, data: result.data };
      } else {
        console.error('Failed to fetch order:', result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async updateOrder(orderId, orderData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
        method: 'PUT',
        headers: this.sessionManager.getHeaders(),
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Order updated successfully:', result.data);
        return { success: true, data: result.data };
      } else {
        console.error('Failed to update order:', result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error updating order:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async deleteOrder(orderId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: this.sessionManager.getHeaders()
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Order deleted successfully');
        return { success: true };
      } else {
        console.error('Failed to delete order:', result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      return { success: false, message: 'Network error' };
    }
  }
}

// Cart Management สำหรับ Setting Summary
class SettingSummaryManager {
  constructor(orderManager) {
    this.orderManager = orderManager;
  }

  // สร้าง order จากข้อมูลใน Setting Summary
  async saveCurrentSetting() {
    try {
      // ดึงข้อมูลจาก localStorage ที่เก็บไว้จากหน้าก่อนหน้า
      const selectedProduct = JSON.parse(localStorage.getItem('selectedProduct') || '{}');
      const selectedRing = JSON.parse(localStorage.getItem('selectedRing') || '{}');
      
      // ดึงข้อมูลจากหน้า Setting Summary
      const settingData = this.extractSettingData();
      
      // สร้าง order data
      const orderData = {
        items: [{
          name: settingData.name || selectedProduct.name || 'Unknown Ring Setting',
          color: settingData.color || selectedRing.color || null,
          metal: settingData.metal || selectedRing.metal || null,
          ring_size: settingData.ringSize || selectedRing.size || null,
          bespoke_custom: settingData.bespokeCustom || selectedRing.bespoke || null,
          carat_weight: settingData.caratWeight || null,
          amount: 1,
          total_price: settingData.totalPrice || 0,
          picture_url: settingData.pictureUrl || null,
          specifications: {
            basePrice: settingData.basePrice || 0,
            gemstonePrice: settingData.gemstonePrice || 0,
            bespokePrice: settingData.bespokePrice || 0,
            gemstoneShape: settingData.gemstoneShape || null,
            gemstoneType: settingData.gemstoneType || null,
            gemstoneClarity: settingData.gemstoneClarity || null,
            ...settingData.additionalSpecs
          }
        }],
        total_amount: settingData.totalPrice || 0,
        shipping_address: null,
        payment_method: null,
        notes: 'Order created from Setting Summary page'
      };

      const result = await this.orderManager.createOrder(orderData);
      
      if (result.success) {
        console.log('Setting saved successfully to order:', result.data.order_id);
        this.showSaveSuccessMessage(result.data.order_id);
        return result;
      } else {
        this.showSaveErrorMessage(result.message);
        return result;
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      this.showSaveErrorMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      return { success: false, message: error.message };
    }
  }

  // ดึงข้อมูลจากหน้า Setting Summary
  extractSettingData() {
    const data = {};

    // ดึงข้อมูลพื้นฐาน
    const nameElement = document.getElementById('setting-name');
    if (nameElement) data.name = nameElement.textContent.trim();

    const colorElement = document.getElementById('setting-color');
    if (colorElement) data.color = colorElement.textContent.trim();

    const metalElement = document.getElementById('setting-metal');
    if (metalElement) data.metal = metalElement.textContent.trim();

    const sizeElement = document.getElementById('setting-size');
    if (sizeElement) {
      const sizeText = sizeElement.textContent.trim();
      const sizeMatch = sizeText.match(/[\d.]+/);
      if (sizeMatch) data.ringSize = parseFloat(sizeMatch[0]);
    }

    // ดึงข้อมูล Bespoke/Custom
    const bespokeElement = document.getElementById('setting-bespoke');
    if (bespokeElement) data.bespokeCustom = bespokeElement.textContent.trim();

    // ดึงข้อมูล Gemstone
    const caratElement = document.getElementById('gemstone-carat');
    if (caratElement) {
      const caratText = caratElement.textContent.trim();
      const caratMatch = caratText.match(/[\d.]+/);
      if (caratMatch) data.caratWeight = parseFloat(caratMatch[0]);
    }

    const shapeElement = document.getElementById('gemstone-shape');
    if (shapeElement) data.gemstoneShape = shapeElement.textContent.trim();

    const typeElement = document.getElementById('gemstone-type');
    if (typeElement) data.gemstoneType = typeElement.textContent.trim();

    const clarityElement = document.getElementById('gemstone-clarity');
    if (clarityElement) data.gemstoneClarity = clarityElement.textContent.trim();

    // ดึงข้อมูลราคา
    const basePriceElement = document.getElementById('base-price');
    if (basePriceElement) {
      const basePriceText = basePriceElement.textContent.replace(/[^\d]/g, '');
      data.basePrice = parseInt(basePriceText) || 0;
    }

    const gemstonePriceElement = document.getElementById('gemstone-price');
    if (gemstonePriceElement) {
      const gemstonePriceText = gemstonePriceElement.textContent.replace(/[^\d]/g, '');
      data.gemstonePrice = parseInt(gemstonePriceText) || 0;
    }

    const bespokePriceElement = document.getElementById('bespoke-price');
    if (bespokePriceElement) {
      const bespokePriceText = bespokePriceElement.textContent.replace(/[^\d]/g, '');
      data.bespokePrice = parseInt(bespokePriceText) || 0;
    }

    const totalPriceElement = document.getElementById('final-total');
    if (totalPriceElement) {
      const totalPriceText = totalPriceElement.textContent.replace(/[^\d]/g, '');
      data.totalPrice = parseInt(totalPriceText) || 0;
    }

    // ดึง URL รูปภาพ
    const mainImageElement = document.querySelector('.product-image img');
    if (mainImageElement) data.pictureUrl = mainImageElement.src;

    return data;
  }

  // แสดงข้อความเมื่อบันทึกสำเร็จ
  showSaveSuccessMessage(orderId) {
    const message = `บันทึกการตั้งค่าเรียบร้อยแล้ว (Order ID: ${orderId})`;
    
    // สร้าง toast notification
    this.showToast(message, 'success');
  }

  // แสดงข้อความเมื่อเกิดข้อผิดพลาด
  showSaveErrorMessage(errorMessage) {
    const message = `เกิดข้อผิดพลาด: ${errorMessage}`;
    
    // สร้าง toast notification
    this.showToast(message, 'error');
  }

  // สร้าง toast notification
  showToast(message, type = 'info') {
    // ลบ toast เก่าถ้ามี
    const existingToast = document.querySelector('.yaniga-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // สร้าง toast element
    const toast = document.createElement('div');
    toast.className = `yaniga-toast yaniga-toast-${type}`;
    toast.innerHTML = `
      <div class="yaniga-toast-content">
        <span>${message}</span>
        <button class="yaniga-toast-close">&times;</button>
      </div>
    `;

    // เพิ่ม CSS สำหรับ toast
    const style = document.createElement('style');
    style.textContent = `
      .yaniga-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        min-width: 300px;
        border-left: 4px solid #007bff;
        animation: yaniga-toast-slide-in 0.3s ease-out;
      }
      
      .yaniga-toast-success {
        border-left-color: #28a745;
      }
      
      .yaniga-toast-error {
        border-left-color: #dc3545;
      }
      
      .yaniga-toast-content {
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .yaniga-toast-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        margin-left: 12px;
        opacity: 0.6;
      }
      
      .yaniga-toast-close:hover {
        opacity: 1;
      }
      
      @keyframes yaniga-toast-slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;

    if (!document.querySelector('#yaniga-toast-styles')) {
      style.id = 'yaniga-toast-styles';
      document.head.appendChild(style);
    }

    // เพิ่ม toast ลงใน DOM
    document.body.appendChild(toast);

    // ตั้งเวลาให้หายไปอัตโนมัติ
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);

    // เพิ่ม event listener สำหรับปุ่มปิด
    const closeButton = toast.querySelector('.yaniga-toast-close');
    closeButton.addEventListener('click', () => {
      toast.remove();
    });
  }
}

// เริ่มต้นการทำงาน
let sessionManager, orderManager, settingSummaryManager;

document.addEventListener('DOMContentLoaded', async () => {
  // เริ่มต้น session management
  sessionManager = new GuestSessionManager();
  await sessionManager.init();
  
  // เริ่มต้น order management
  orderManager = new OrderManager(sessionManager);
  
  // เริ่มต้น setting summary management (เฉพาะในหน้า Setting Summary)
  if (window.location.pathname.includes('Setting_Summary.html')) {
    settingSummaryManager = new SettingSummaryManager(orderManager);
    
    // เพิ่มปุ่มบันทึกการตั้งค่า
    addSaveSettingButton();
  }
  
  console.log('Yaniga Diamond API connection initialized');
});

// เพิ่มปุ่มบันทึกการตั้งค่าในหน้า Setting Summary
function addSaveSettingButton() {
  // หาตำแหน่งที่เหมาะสมสำหรับปุ่ม (หลังจาก Add to Cart)
  const addToCartButton = document.querySelector('.add-to-cart');
  
  if (addToCartButton) {
    const saveButton = document.createElement('button');
    saveButton.className = 'btn btn-outline-primary btn-lg w-100 mt-2';
    saveButton.innerHTML = '<i class="bi bi-bookmark"></i> บันทึกการตั้งค่า';
    saveButton.id = 'save-setting-btn';
    
    saveButton.addEventListener('click', async () => {
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="bi bi-hourglass-split"></i> กำลังบันทึก...';
      
      const result = await settingSummaryManager.saveCurrentSetting();
      
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="bi bi-bookmark"></i> บันทึกการตั้งค่า';
    });
    
    // แทรกปุ่มหลังจาก Add to Cart
    addToCartButton.parentNode.insertBefore(saveButton, addToCartButton.nextSibling);
  }
}

// ฟังก์ชันสำหรับการต่ออายุ session อัตโนมัติ
setInterval(async () => {
  if (sessionManager) {
    await sessionManager.extendSession();
  }
}, 24 * 60 * 60 * 1000); // ต่ออายุทุก 24 ชั่วโมง

// Export สำหรับใช้งานในส่วนอื่น ๆ
window.YanigaAPI = {
  sessionManager,
  orderManager,
  settingSummaryManager
};
