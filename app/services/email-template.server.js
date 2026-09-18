/**
 * Returns a clean, professional category badge for each recipe slug.
 */
function getRecipeCategory(slug) {
  switch (slug) {
    case "rising-demand-falling-stock":
      return "Inventory & Demand";
    case "high-traffic-low-conversion":
      return "Traffic & Conversion";
    case "weekly-performance-digest":
      return "Performance Digest";
    case "slowing-down-bestseller":
      return "Sales Velocity";
    case "abandoned-momentum":
      return "Checkout Momentum";
    case "new-product-underperforming":
      return "Product Launch";
    default:
      return "Automation Alert";
  }
}

/**
 * Generates a high-end, responsive, branded HTML email template for FlowPacks alerts.
 * Compatible across all major email clients (Gmail, Outlook, Apple Mail).
 */
export function generateAlertEmailHtml({ evaluationResult, shopDomain }) {
  const category = getRecipeCategory(evaluationResult.recipeSlug);
  const recipeName = evaluationResult.recipeName || "Automation Triggered";
  const summary = evaluationResult.summary || "Automated conditions met.";
  const flaggedItems = Array.isArray(evaluationResult.flaggedItems) ? evaluationResult.flaggedItems : [];

  const totalFlagged = flaggedItems.length;
  const displayItems = flaggedItems.slice(0, 8);
  const remainingCount = totalFlagged > 8 ? totalFlagged - 8 : 0;

  const activityLogUrl = `https://${shopDomain}/admin/apps/flowpacks/app/activity-log`;
  const settingsUrl = `https://${shopDomain}/admin/apps/flowpacks/app/settings`;


  // Render items rows
  const itemsHtml = displayItems
    .map((item) => {
      const title = item.title || item.name || item.productId || "Store Metric";
      const desc =
        item.message ||
        item.detail ||
        item.reason ||
        (item.totalSales !== undefined
          ? `$${Number(item.totalSales).toFixed(2)} sales across ${item.totalOrders} orders`
          : "");

      const imgTag = item.productImageUrl
        ? `<img src="${item.productImageUrl}" alt="${title}" width="44" height="44" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid #E2E8F0; display: block;" />`
        : `<div style="width: 44px; height: 44px; border-radius: 8px; background-color: #F1F5F9; border: 1px solid #E2E8F0; color: #64748B; text-align: center; line-height: 44px; font-weight: 700; font-size: 13px;">
            ITEM
          </div>`;

      return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #F1F5F9;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="52" valign="top" style="vertical-align: top;">
                ${imgTag}
              </td>
              <td valign="middle" style="vertical-align: middle; padding-left: 10px;">
                <div style="font-size: 13.5px; font-weight: 700; color: #0F172A; line-height: 1.35; margin-bottom: 3px;">
                  ${title}
                </div>
                <div style="font-size: 12.5px; color: #475569; line-height: 1.3;">
                  ${desc}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlowPacks Alert: ${recipeName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0F172A;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; padding: 36px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Email Container (580px Max) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);">
          
          <!-- Top Premium Brand Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4318FF 0%, #5925D8 50%, #632DE0 100%); padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    
                    <!-- Main Brand Name (Biggest) -->
                    <div style="font-size: 24px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 6px;">
                      FlowPacks
                    </div>

                    <!-- Alert / Recipe Name Subheading -->
                    <div style="font-size: 16px; font-weight: 600; color: rgba(255, 255, 255, 0.92); line-height: 1.35; margin-bottom: 10px;">
                      Alert: ${recipeName}
                    </div>

                    <!-- Category Pill Badge -->
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; padding: 3px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #FFFFFF;">
                      ${category}
                    </div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Store Metadata Row -->
          <tr>
            <td style="padding: 14px 32px; background-color: #F8FAFC; border-bottom: 1px solid #F1F5F9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 13px; color: #64748B;">
                    <span style="font-weight: 600; color: #334155;">Store:</span> 
                    <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background-color: #EEF2FF; color: #4318FF; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px;">${shopDomain}</span>
                  </td>
                  <td align="right" style="font-size: 12px; font-weight: 600; color: #059669;">
                    <span style="display: inline-block; width: 7px; height: 7px; background-color: #10B981; border-radius: 50%; margin-right: 5px; vertical-align: middle;"></span>
                    Action Required
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 28px 32px;">
              
              <!-- Summary Callout Box -->
              <div style="background-color: #F8F5FF; border: 1px solid #E9D5FF; border-left: 4px solid #5925D8; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #5925D8; letter-spacing: 0.05em; margin-bottom: 4px;">
                  Summary
                </div>
                <div style="font-size: 14px; font-weight: 600; color: #1E293B; line-height: 1.45;">
                  ${summary}
                </div>
              </div>

              <!-- Flagged Items Section -->
              ${
                totalFlagged > 0
                  ? `
                <div style="font-size: 12.5px; font-weight: 700; color: #475569; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.04em;">
                  Flagged Items (${totalFlagged})
                </div>
                
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                  ${itemsHtml}
                </table>

                ${
                  remainingCount > 0
                    ? `
                  <div style="font-size: 12.5px; color: #64748B; margin-bottom: 20px; text-align: center; background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px; padding: 10px;">
                    +${remainingCount} additional items in your store report
                  </div>
                `
                    : ""
                }
              `
                  : ""
              }

              <!-- Primary Action CTA Button -->
              <div style="text-align: center; margin: 32px 0 12px 0;">
                <a href="${activityLogUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #4318FF; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(67, 24, 255, 0.25);">
                  View Full Report in FlowPacks →
                </a>
              </div>

            </td>
          </tr>

          <!-- Email Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #F1F5F9; text-align: center; font-size: 12px; color: #94A3B8; line-height: 1.6;">
              This automated alert was generated by <strong style="color: #475569;">FlowPacks</strong> for <strong style="color: #475569;">${shopDomain}</strong>.
              <br />
              <a href="${settingsUrl}" target="_blank" rel="noopener noreferrer" style="color: #4318FF; text-decoration: underline; margin-top: 6px; display: inline-block; font-weight: 500;">
                Manage notification settings
              </a>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}
