const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('开始清理数据库...');

    // 删除所有数据（按依赖关系顺序）
    await prisma.overlapStats.deleteMany({});
    console.log('✓ 删除重叠统计数据');

    await prisma.timeSlot.deleteMany({});
    console.log('✓ 删除时间段数据');

    await prisma.participant.deleteMany({});
    console.log('✓ 删除参与者数据');

    await prisma.shareLink.deleteMany({});
    console.log('✓ 删除分享链接数据');

    await prisma.schedule.deleteMany({});
    console.log('✓ 删除时间表数据');

    console.log('🎉 数据库清理完成！');
  } catch (error) {
    console.error('清理数据库时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
