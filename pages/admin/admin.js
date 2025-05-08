// pages/admin/admin.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  navigateToSeatManage: function () {
    wx.navigateTo({
      url: '/pages/admin/seat-manage/seat-manage'
    });
  },

  navigateToBookingReview: function () {
    wx.navigateTo({
      url: '/pages/admin/reservation-review/reservation-review'
    });
  },

  navigateToNoticeManage: function () {
    wx.navigateTo({
      url: '/pages/admin/notice-manage/notice-manage'
    });
  },

});