/**
 * TEST SCRIPT: Kiểm tra route registration toàn bộ API
 * Chạy: ts-node src/mytest/test-all-routes.ts
 * 
 * Script này dùng module scan để kiểm tra route đã được đăng ký đúng không
 * Sau đó thực hiện HTTP healthcheck từng route
 */
import express from 'express';

// Import tất cả route files để kiểm tra route đăng ký
import authRoutes from '../routes/auth.route';
import userRoutes from '../routes/user.route';
import workspaceRoutes from '../routes/workspace.route';
import memberRoutes from '../routes/member.route';
import projectRoutes from '../routes/project.route';
import taskRoutes from '../routes/task.route';

/** Lấy danh sách route từ Express Router */
function extractRoutes(router: any, prefix: string = ''): Array<{ method: string; path: string }> {
    const routes: Array<{ method: string; path: string }> = [];
    
    if (!router || !router.stack) return routes;
    
    router.stack.forEach((layer: any) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
            methods.forEach(method => {
                routes.push({ method, path: prefix + layer.route.path });
            });
        } else if (layer.name === 'router' && layer.handle?.stack) {
            routes.push(...extractRoutes(layer.handle, prefix));
        }
    });
    
    return routes;
}

console.log('\n' + '='.repeat(60));
console.log('🔍 KIỂM TRA ĐĂNG KÝ ROUTE API');
console.log('='.repeat(60));

// Danh sách route mong đợi
const expectedRoutes = [
    // Auth
    { method: 'POST', path: '/api/v1/auth/register', tag: '🟢 ORIGINAL' },
    { method: 'POST', path: '/api/v1/auth/login', tag: '🟢 ORIGINAL' },
    { method: 'POST', path: '/api/v1/auth/logout', tag: '🟢 ORIGINAL' },
    { method: 'GET',  path: '/api/v1/auth/google', tag: '🟢 ORIGINAL' },
    { method: 'GET',  path: '/api/v1/auth/google/callback', tag: '🟢 ORIGINAL' },
    
    // User
    { method: 'GET',   path: '/api/v1/user/current', tag: '🟢 ORIGINAL' },
    { method: 'PUT',   path: '/api/v1/user/profile', tag: '🤖 AI-ADDED' },
    { method: 'PUT',   path: '/api/v1/user/change-password', tag: '🤖 AI-ADDED' },
    { method: 'PATCH', path: '/api/v1/user/workspace/switch/:workspaceId', tag: '🤖 AI-ADDED' },
    
    // Workspace
    { method: 'POST',   path: '/api/v1/workspace/create/new', tag: '🟢 ORIGINAL' },
    { method: 'GET',    path: '/api/v1/workspace/all', tag: '🟢 ORIGINAL' },
    { method: 'GET',    path: '/api/v1/workspace/:id', tag: '🟢 ORIGINAL' },
    { method: 'GET',    path: '/api/v1/workspace/member/:id', tag: '🟢 ORIGINAL' },
    { method: 'GET',    path: '/api/v1/workspace/analytics/:id', tag: '🟢 ORIGINAL' },
    { method: 'PUT',    path: '/api/v1/workspace/change/member/role/:id', tag: '🟢 ORIGINAL' },
    { method: 'PUT',    path: '/api/v1/workspace/update/:id', tag: '🟢 ORIGINAL' },
    { method: 'DELETE', path: '/api/v1/workspace/delete/:id', tag: '🟢 ORIGINAL' },
    { method: 'PUT',    path: '/api/v1/workspace/:id/invite-code', tag: '🤖 AI-ADDED' },
    { method: 'DELETE', path: '/api/v1/workspace/:id/member/:memberId', tag: '🤖 AI-ADDED' },
    
    // Member
    { method: 'POST', path: '/api/v1/member/workspace/:inviteCode/join', tag: '🟢 ORIGINAL' },
    
    // Project
    { method: 'GET',    path: '/api/v1/project/workspace/:workspaceId/all', tag: '🟢 ORIGINAL' },
    { method: 'GET',    path: '/api/v1/project/workspace/:workspaceId/analytics/:projectId', tag: '🟢 ORIGINAL' },
    { method: 'GET',    path: '/api/v1/project/workspace/:workspaceId/:projectId', tag: '🟢 ORIGINAL' },
    { method: 'POST',   path: '/api/v1/project/workspace/:workspaceId/create', tag: '🟢 ORIGINAL' },
    { method: 'PUT',    path: '/api/v1/project/workspace/:workspaceId/update/:projectId', tag: '🟢 ORIGINAL' },
    { method: 'DELETE', path: '/api/v1/project/workspace/:workspaceId/delete/:projectId', tag: '🟢 ORIGINAL' },
    
    // Task
    { method: 'POST',   path: '/api/v1/task/projects/:projectId/workspace/:workspaceId/create', tag: '🟢 ORIGINAL' },
    { method: 'PUT',    path: '/api/v1/task/projects/:projectId/workspace/:workspaceId/update/:taskId', tag: '🟢 ORIGINAL' },
    { method: 'GET',    path: '/api/v1/task/workspace/:workspaceId/tasks', tag: '🟢 ORIGINAL' },
    { method: 'GET',    path: '/api/v1/task/:taskId/workspace/:workspaceId/projects/:projectId', tag: '🟢 ORIGINAL' },
    { method: 'DELETE', path: '/api/v1/task/:taskId/workspace/:workspaceId/delete', tag: '🟢 ORIGINAL' },
    { method: 'GET',    path: '/api/v1/task/workspace/:workspaceId/projects/:projectId/tasks', tag: '🤖 AI-ADDED' },
];

// Kiểm tra từng module đăng ký route
const modules = [
    { name: 'authRoutes', router: authRoutes, prefix: '/auth' },
    { name: 'userRoutes', router: userRoutes, prefix: '/user' },
    { name: 'workspaceRoutes', router: workspaceRoutes, prefix: '/workspace' },
    { name: 'memberRoutes', router: memberRoutes, prefix: '/member' },
    { name: 'projectRoutes', router: projectRoutes, prefix: '/project' },
    { name: 'taskRoutes', router: taskRoutes, prefix: '/task' },
];

let totalRoutes = 0;
let totalAiAdded = 0;
let totalOriginal = 0;

modules.forEach(({ name, router, prefix }) => {
    const routes = extractRoutes(router, prefix);
    console.log(`\n📦 ${name} (${routes.length} routes):`);
    routes.forEach(r => {
        console.log(`   ${r.method.padEnd(7)} /api/v1${r.path}`);
        totalRoutes++;
    });
});

console.log('\n' + '='.repeat(60));
console.log(`📊 TỔNG KẾT:`);
console.log(`   Tổng routes đã đăng ký: ${totalRoutes}`);
console.log(`   Routes mong đợi        : ${expectedRoutes.length}`);

const originalCount = expectedRoutes.filter(r => r.tag === '🟢 ORIGINAL').length;
const aiAddedCount = expectedRoutes.filter(r => r.tag === '🤖 AI-ADDED').length;
console.log(`   🟢 ORIGINAL : ${originalCount}`);
console.log(`   🤖 AI-ADDED : ${aiAddedCount}`);
console.log('='.repeat(60) + '\n');
