/**
 * 履歴記録が正しく実装されているか確認するスクリプト
 * 実行方法: npx tsx scripts/verify-audit-logging.ts
 */

import { readFileSync } from "fs";
import { join } from "path";

const apiRoutes = [
  // 作成API
  { path: "app/api/companies/route.ts", entity: "Company", action: "CREATE", method: "POST" },
  { path: "app/api/sales-opportunities/route.ts", entity: "SalesOpportunity", action: "CREATE", method: "POST" },
  { path: "app/api/projects/route.ts", entity: "Project", action: "CREATE", method: "POST" },
  { path: "app/api/contacts/route.ts", entity: "Contact", action: "CREATE", method: "POST" },
  { path: "app/api/equipment/route.ts", entity: "Equipment", action: "CREATE", method: "POST" },
  { path: "app/api/work-records/route.ts", entity: "WorkRecord", action: "CREATE", method: "POST" },
  
  // 更新API
  { path: "app/api/companies/[id]/route.ts", entity: "Company", action: "UPDATE", method: "PUT" },
  { path: "app/api/sales-opportunities/[id]/route.ts", entity: "SalesOpportunity", action: "UPDATE", method: "PATCH" },
  { path: "app/api/projects/[id]/route.ts", entity: "Project", action: "UPDATE", method: "PATCH" },
  { path: "app/api/contacts/[id]/route.ts", entity: "Contact", action: "UPDATE", method: "PATCH" },
  { path: "app/api/equipment/[id]/route.ts", entity: "Equipment", action: "UPDATE", method: "PATCH" },
  { path: "app/api/work-records/[id]/route.ts", entity: "WorkRecord", action: "UPDATE", method: "PATCH" },
  
  // 削除API
  { path: "app/api/companies/[id]/route.ts", entity: "Company", action: "DELETE", method: "DELETE" },
  { path: "app/api/sales-opportunities/[id]/route.ts", entity: "SalesOpportunity", action: "DELETE", method: "DELETE" },
  { path: "app/api/projects/[id]/route.ts", entity: "Project", action: "DELETE", method: "DELETE" },
  { path: "app/api/contacts/[id]/route.ts", entity: "Contact", action: "DELETE", method: "DELETE" },
  { path: "app/api/equipment/[id]/route.ts", entity: "Equipment", action: "DELETE", method: "DELETE" },
  { path: "app/api/work-records/[id]/route.ts", entity: "WorkRecord", action: "DELETE", method: "DELETE" },
];

const detailScreens = [
  { path: "app/companies/[id]/client-company-detail.tsx", entity: "Company", api: "/api/companies/${id}" },
  { path: "app/sales-opportunities/[id]/client-sales-opportunity-detail.tsx", entity: "SalesOpportunity", api: "/api/sales-opportunities/${id}" },
  { path: "app/projects/[id]/client-project-detail.tsx", entity: "Project", api: "/api/projects/${id}" },
  { path: "app/contacts/[id]/client-contact-detail.tsx", entity: "Contact", api: "/api/contacts/${id}" },
  { path: "app/equipment/[id]/client-equipment-detail.tsx", entity: "Equipment", api: "/api/equipment/${id}" },
  { path: "app/work-records/[id]/client-inspection-record-detail.tsx", entity: "WorkRecord", api: "/api/work-records/${id}" },
];

console.log("履歴記録の実装状況を確認中...\n");

let allPassed = true;

// APIルートの確認
console.log("=== APIルートでの履歴記録 ===\n");
for (const route of apiRoutes) {
  try {
    const content = readFileSync(join(process.cwd(), route.path), "utf-8");
    
    // createAuditLogのインポートを確認
    const hasImport = content.includes('import { createAuditLog }');
    
    // 適切なメソッドでcreateAuditLogが呼ばれているか確認
    let hasAuditLog = false;
    if (route.method === "POST") {
      hasAuditLog = content.includes(`await createAuditLog("${route.entity}"`) && 
                   content.includes(route.action);
    } else if (route.method === "PUT" || route.method === "PATCH") {
      hasAuditLog = content.includes(`await createAuditLog("${route.entity}"`) && 
                   content.includes(route.action);
    } else if (route.method === "DELETE") {
      hasAuditLog = content.includes(`await createAuditLog("${route.entity}"`) && 
                   content.includes(route.action);
    }
    
    const status = hasImport && hasAuditLog ? "✓" : "✗";
    const message = hasImport && hasAuditLog 
      ? `OK` 
      : `NG (${hasImport ? 'インポートあり' : 'インポートなし'}, ${hasAuditLog ? '呼び出しあり' : '呼び出しなし'})`;
    
    console.log(`${status} ${route.entity} ${route.action} (${route.method}): ${message}`);
    
    if (!hasImport || !hasAuditLog) {
      allPassed = false;
    }
  } catch (error) {
    console.log(`✗ ${route.entity} ${route.action} (${route.method}): ファイルが見つかりません`);
    allPassed = false;
  }
}

// 詳細画面の確認
console.log("\n=== 詳細画面でのAPI呼び出し ===\n");
for (const screen of detailScreens) {
  try {
    const content = readFileSync(join(process.cwd(), screen.path), "utf-8");
    
    // APIエンドポイントへの呼び出しを確認
    const apiPattern1 = screen.api.replace("${id}", "");
    const apiPattern2 = screen.api.replace("${id}", "`${");
    const hasApiCall = content.includes(apiPattern1) || content.includes(apiPattern2);
    
    const updateMethod = screen.entity === "Company" ? "PUT" : "PATCH";
    const hasUpdateCall = content.includes(`method: "${updateMethod}"`) || 
                         content.includes(`method: '${updateMethod}'`);
    
    const status = hasApiCall && hasUpdateCall ? "✓" : "✗";
    const message = hasApiCall && hasUpdateCall 
      ? `OK` 
      : `NG (${hasApiCall ? 'API呼び出しあり' : 'API呼び出しなし'}, ${hasUpdateCall ? '更新メソッドあり' : '更新メソッドなし'})`;
    
    console.log(`${status} ${screen.entity}詳細画面: ${message}`);
    
    if (!hasApiCall || !hasUpdateCall) {
      allPassed = false;
    }
  } catch (error) {
    console.log(`✗ ${screen.entity}詳細画面: ファイルが見つかりません`);
    allPassed = false;
  }
}

// 作成フォームの確認
console.log("\n=== 作成フォームでのAPI呼び出し ===\n");
const createForms = [
  { path: "components/companies/company-create-form.tsx", api: "/api/companies" },
  { path: "components/contacts/contact-create-form.tsx", api: "/api/contacts" },
  { path: "components/sales-opportunities/sales-opportunity-create-form.tsx", api: "/api/sales-opportunities" },
  { path: "components/projects/project-create-form.tsx", api: "/api/projects" },
  { path: "components/equipment/equipment-create-form.tsx", api: "/api/equipment" },
  { path: "components/work-records/work-record-create-form.tsx", api: "/api/work-records" },
];

for (const form of createForms) {
  try {
    const content = readFileSync(join(process.cwd(), form.path), "utf-8");
    
    const hasApiCall = content.includes(form.api);
    const hasPostCall = content.includes('method: "POST"') || content.includes("method: 'POST'");
    
    const status = hasApiCall && hasPostCall ? "✓" : "✗";
    const message = hasApiCall && hasPostCall 
      ? `OK` 
      : `NG (${hasApiCall ? 'API呼び出しあり' : 'API呼び出しなし'}, ${hasPostCall ? 'POSTメソッドあり' : 'POSTメソッドなし'})`;
    
    const formName = form.path.split("/")[1];
    console.log(`${status} ${formName}: ${message}`);
    
    if (!hasApiCall || !hasPostCall) {
      allPassed = false;
    }
  } catch (error) {
    console.log(`✗ ${form.path}: ファイルが見つかりません`);
    allPassed = false;
  }
}

console.log("\n" + "=".repeat(50));
if (allPassed) {
  console.log("✓ すべての履歴記録が正しく実装されています");
} else {
  console.log("✗ 一部の履歴記録が実装されていない可能性があります");
  console.log("  上記のNG項目を確認してください");
}

