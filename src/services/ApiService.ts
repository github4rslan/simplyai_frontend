import { API_BASE_URL } from "@/config/api";

export const savePlan = async (planData: any, isUpdate: boolean) => {
  const url = isUpdate
    ? `${API_BASE_URL}/plans/${planData.id}`
    : `${API_BASE_URL}/plans`;

  const method = isUpdate ? "PUT" : "POST";

  console.log("Sending request to:", url);
  console.log("Method:", method);
  console.log("Is Update:", isUpdate);
  console.log("Plan data:", planData);

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(planData),
  });

  console.log("Response status:", response.status);
  console.log("Response ok:", response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response:", errorText);
    throw new Error(`Failed to save plan: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log("Response data:", result);
  return result;
};

export const fetchAllPlans = async () => {
  const url = `${API_BASE_URL}/plans`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch plans");
  }

  const result = await response.json();
  return result.data; // Return the data array from the backend response
};

export const fetchAllPlansForAdmin = async () => {
  const url = `${API_BASE_URL}/plans/admin/all`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch all plans for admin");
  }

  const result = await response.json();
  return result.data; // Return the data array from the backend response
};

export const fetchPlan = async (id: string) => {
  const url = `${API_BASE_URL}/plans/${id}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch plan");
  }

  const result = await response.json();
  return result; // Return the full result with success flag
};

export const fetchPlanForAdmin = async (id: string) => {
  const url = `${API_BASE_URL}/plans/admin/${id}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch plan for admin");
  }

  const result = await response.json();
  return result; // Return the full result with success flag
};

export const deletePlan = async (id: string) => {
  const url = `${API_BASE_URL}/plans/${id}`;

  const response = await fetch(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete plan");
  }

  return await response.json();
};

export const updatePlanStatus = async (id: string, active: boolean) => {
  try {
    // First, fetch the current plan data using admin endpoint
    const currentPlan = await fetchPlanForAdmin(id);
    if (!currentPlan.success) {
      throw new Error("Failed to fetch current plan data");
    }

    const planData = currentPlan.data;

    // Update the plan with all existing data plus the new active status

    const url = `${API_BASE_URL}/plans/${id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: planData.name,
        description: planData.description || "",
        price: planData.price || 0,
        is_free: planData.is_free || false,
        features: planData.features || [],
        active: active,
        button_text: planData.button_text || "",
        button_variant: planData.button_variant || "",
        sort_order: planData.sort_order || 0,
        interval: planData.interval || "month",
        is_popular: planData.is_popular || false,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update plan status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating plan status:", error);
    throw error;
  }
};

// Questionnaire API functions
export const fetchAllQuestionnaires = async () => {
  const url = `${API_BASE_URL}/questionnaires`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch questionnaires");
  }

  const result = await response.json();
  return result.data;
};

export const fetchPlanQuestionnaires = async (planId: string) => {
  const url = `${API_BASE_URL}/plans/${planId}/questionnaires`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch plan questionnaires");
  }

  const result = await response.json();
  return result.data;
};

export const savePlanQuestionnaires = async (
  planId: string,
  questionnaires: any[]
) => {
  const url = `${API_BASE_URL}/plans/${planId}/questionnaires`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ questionnaires }),
  });

  if (!response.ok) {
    throw new Error("Failed to save plan questionnaires");
  }

  return await response.json();
};

// Fetch questionnaires for authenticated user based on their subscription plan
export const fetchUserQuestionnaires = async (token: string) => {
  const url = `${API_BASE_URL}/forms/user-questionnaires`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user questionnaires");
  }

  const result = await response.json();
  return result;
};

// Fetch questionnaires with plan-based access control
export const fetchUserQuestionnairesWithAccess = async (userId: string) => {
  const url = `${API_BASE_URL}/user-questionnaires-with-access?userId=${encodeURIComponent(
    userId
  )}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user questionnaires with access");
  }

  const result = await response.json();
  return result;
};

// Fetch user subscription details for dashboard
export const fetchUserSubscription = async (token: string) => {
  const url = `${API_BASE_URL}/forms/user-subscription`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user subscription");
  }

  const result = await response.json();
  return result;
};

// Authentication API functions
export const registerUser = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  subscription_plan?: string;
}) => {
  const url = `${API_BASE_URL}/auth/register`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Registration failed");
  }

  return await response.json();
};

export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  const url = `${API_BASE_URL}/auth/login`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed");
  }

  return await response.json();
};

export const getCurrentUser = async (token: string) => {
  const url = `${API_BASE_URL}/auth/me`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to get user data");
  }

  return await response.json();
};

export const logoutUser = async (token: string) => {
  const url = `${API_BASE_URL}/auth/logout`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Logout failed");
  }

  return await response.json();
};

// Google registration API function
export const registerUserWithGoogle = async (
  googleData: any,
  subscription_plan?: string
) => {
  const url = `${API_BASE_URL}/auth/register/google`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      googleData,
      subscription_plan,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Google registration failed");
  }

  return await response.json();
};

// Facebook registration API function
export const registerUserWithFacebook = async (
  facebookData: any,
  subscription_plan?: string
) => {
  const url = `${API_BASE_URL}/auth/register/facebook`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      facebookData,
      subscription_plan,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Facebook registration failed");
  }

  return await response.json();
};

// Process regular payment (non-OAuth) and create account
export const processPayment = async (
  userInfo: any,
  paymentInfo: any,
  planInfo: any,
  tempUserId?: string
) => {
  const url = `${API_BASE_URL}/payment/process-payment`;

  const requestBody: {
    userInfo: any;
    paymentInfo: any;
    planInfo: any;
    tempUserId?: string;
  } = {
    userInfo,
    paymentInfo,
    planInfo,
  };

  // Include tempUserId if provided for temporary registrations
  if (tempUserId) {
    requestBody.tempUserId = tempUserId;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Payment processing failed");
  }

  return await response.json();
};

// Process payment for OAuth users (Google/Facebook login users)
export const processOAuthPayment = async (
  userId: string,
  userInfo: any,
  paymentInfo: any,
  planInfo: any
) => {
  const url = `${API_BASE_URL}/payment/process-oauth-payment`;

  console.log("🔐 Processing OAuth payment...");
  console.log("User ID:", userId);
  console.log("User Info:", userInfo);
  console.log("Payment Info:", paymentInfo);
  console.log("Plan Info:", planInfo);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      userInfo,
      paymentInfo,
      planInfo,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("❌ OAuth payment failed:", errorData);
    throw new Error(errorData.message || "OAuth payment processing failed");
  }

  const result = await response.json();
  console.log("✅ OAuth payment successful:", result);
  return result;
};

// Complete user registration with plan selection from temporary data
export const completeRegistrationWithPlan = async (
  tempUserData: any,
  planId: string
) => {
  const url = `${API_BASE_URL}/auth/register/complete-with-plan`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tempUserData,
      planId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Registration completion failed");
  }

  return await response.json();
};

// Check if email exists in database
export const checkEmailExists = async (email: string) => {
  const url = `${API_BASE_URL}/auth/check-email`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to check email availability");
  }

  const result = await response.json();
  return result;
};
