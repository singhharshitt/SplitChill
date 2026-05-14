import fairimage from "../assets/fairimage.png";
import groupsplit from "../assets/groupsplit.png";
import shopptense from "../assets/shopptense.png";

export const blogTopics = {
  fairness: {
    slug: "fairness",
    eyebrow: "Fairness Engine",
    title: "How SplitChill decides what feels fair",
    summary: "A practical look at income awareness, contribution history, and transparent split explanations.",
    sticker: fairimage,
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Receipts and financial notes arranged on a desk",
    imageSource: "Unsplash",
    sections: [
      {
        heading: "Fair is not always equal",
        body: "Equal splits are fast, but they miss context. SplitChill looks at who paid before, who participated, and whether a split would leave one person carrying too much of the group.",
      },
      {
        heading: "Every recommendation stays explainable",
        body: "AI recommendations are paired with a fairness score and plain-language reasoning so the group can understand why a split changed.",
      },
    ],
  },
  "ai-split": {
    slug: "ai-split",
    eyebrow: "AI Split",
    title: "AI split recommendations without awkward math",
    summary: "See how the app turns a receipt or expense into a balanced split recommendation.",
    sticker: fairimage,
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Budget notes and calculator for expense planning",
    imageSource: "Unsplash",
    sections: [
      {
        heading: "Inputs that matter",
        body: "The engine considers amount, participants, split type, previous balances, and member contribution patterns before suggesting shares.",
      },
      {
        heading: "Fast enough for the moment",
        body: "Recommendations appear while you are creating a split, then update balances, analytics, and chat context as soon as the expense is saved.",
      },
    ],
  },
  groups: {
    slug: "groups",
    eyebrow: "Groups",
    title: "Shared groups that stay in sync",
    summary: "Create groups, add members, chat, and keep balances live across everyone involved.",
    sticker: groupsplit,
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Friends sitting together and talking",
    imageSource: "Unsplash",
    sections: [
      {
        heading: "Groups are the source of truth",
        body: "Members, expenses, fairness history, analytics, and chat all belong to a group so the full story stays together.",
      },
      {
        heading: "Live updates reduce second guessing",
        body: "When someone adds an expense or sends a message, connected members see the new state immediately without needing to refresh.",
      },
    ],
  },
  receipts: {
    slug: "receipts",
    eyebrow: "Receipts",
    title: "From shopping and receipts to clean expense records",
    summary: "Use SplitChill for groceries, shopping trips, spending logs, and payment follow-up.",
    sticker: shopptense,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Fresh groceries in a market aisle",
    imageSource: "Unsplash",
    sections: [
      {
        heading: "Built for real spending",
        body: "Shopping, dining, and shared purchases can be entered as expenses and reflected in group balances right away.",
      },
      {
        heading: "Receipt-ready backend",
        body: "The backend includes receipt scanning support, so the client can grow into OCR-assisted item capture without changing the core expense flow.",
      },
    ],
  },
  chat: {
    slug: "chat",
    eyebrow: "Realtime Chat",
    title: "Chat that carries financial context",
    summary: "Group messages, typing status, and presence make shared money conversations feel current.",
    sticker: groupsplit,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Laptop showing a communication workspace",
    imageSource: "Unsplash",
    sections: [
      {
        heading: "Messages update live",
        body: "Socket-powered chat keeps group discussion in the same place as balances and expenses, with HTTP fallback when a socket is unavailable.",
      },
      {
        heading: "Presence helps the app feel alive",
        body: "Online counts and typing indicators show when people are active in a group, which makes financial follow-up less stale.",
      },
    ],
  },
  analytics: {
    slug: "analytics",
    eyebrow: "Analytics",
    title: "Analytics for imbalance before it becomes conflict",
    summary: "Fairness trends, contribution patterns, payment usage, and suggestions help groups stay balanced.",
    sticker: fairimage,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Analytics dashboard on a computer screen",
    imageSource: "Unsplash",
    sections: [
      {
        heading: "Patterns beat one-off guesses",
        body: "Analytics combines contribution history and group balances so SplitChill can identify where imbalance is forming.",
      },
      {
        heading: "Suggestions stay action-oriented",
        body: "Predictions and alerts are designed to turn into useful next steps, such as who should settle or who might pay next.",
      },
    ],
  },
  payments: {
    slug: "payments",
    eyebrow: "Payments",
    title: "Settlements with secure payment context",
    summary: "Manual settlement, payment initiation, OTP verification, and payment events are tied back to transactions.",
    sticker: shopptense,
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Online payment card and phone",
    imageSource: "Unsplash",
    sections: [
      {
        heading: "Payments follow transactions",
        body: "A settlement creates a transaction, and payment status can be tracked against that transaction instead of floating separately.",
      },
      {
        heading: "Verification matters",
        body: "The backend supports OTP and payment event history so payment state can be confirmed before the UI marks money as settled.",
      },
    ],
  },
};

export const blogTopicList = Object.values(blogTopics);

export function getBlogTopic(slug) {
  return blogTopics[slug] || blogTopics.fairness;
}
