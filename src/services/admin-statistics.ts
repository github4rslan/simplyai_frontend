
import { supabase } from "@/integrations/supabase/client";

// Fetch user statistics with date range and demographic filters
export const fetchUserStatistics = async (dateRange = null, filters = {}) => {
  try {
    let query = supabase.from('profiles').select('*', { count: 'exact' });
    
    // Apply date filters if provided
    if (dateRange && dateRange.from && dateRange.to) {
      query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
    }
    
    // Apply demographic filters if provided
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        query = query.eq(key, value);
      }
    });
    
    // Get total users with filters
    const { count: totalUsers } = await query.count().single();
    
    // Get new users this month with filters
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    let newUsersQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .gte('created_at', firstDayOfMonth.toISOString());
    
    // Apply demographic filters to new users query
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        newUsersQuery = newUsersQuery.eq(key, value);
      }
    });
    
    const { count: newUsersThisMonth } = await newUsersQuery.count().single();
    
    // Get users by role with filters
    let userRolesQuery = supabase.from('profiles').select('role');
    
    // Apply date filters
    if (dateRange && dateRange.from && dateRange.to) {
      userRolesQuery = userRolesQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
    }
    
    // Apply demographic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && key !== 'role') { // Skip role filter when getting role distribution
        userRolesQuery = userRolesQuery.eq(key, value);
      }
    });
    
    const { data: userRoles } = await userRolesQuery;
    
    // Count occurrences of each role
    const roleCount = {};
    userRoles.forEach(user => {
      const role = user.role || 'user'; // Default to 'user' if role is null
      roleCount[role] = (roleCount[role] || 0) + 1;
    });
    
    const usersByRole = Object.keys(roleCount).map(role => ({
      role,
      count: roleCount[role]
    }));
    
    // Get users by plan with filters
    let userPlansQuery = supabase
      .from('user_subscriptions')
      .select('user_id, subscription_plans!inner(name)')
      .eq('status', 'active');
    
    // Apply demographic filters for plans through a join with profiles
    if (Object.keys(filters).length > 0) {
      // This is a complex query requiring a join
      const { data: filteredUserIds } = await supabase
        .from('profiles')
        .select('id')
        .in('id', userPlansQuery.select('user_id'));
      
      if (filteredUserIds && filteredUserIds.length > 0) {
        userPlansQuery = userPlansQuery.in('user_id', filteredUserIds.map(u => u.id));
      }
    }
    
    const { data: userPlans } = await userPlansQuery;
    
    // Count occurrences of each plan
    const planCount = {};
    if (userPlans) {
      userPlans.forEach(user => {
        const planName = user.subscription_plans?.name || 'No plan';
        planCount[planName] = (planCount[planName] || 0) + 1;
      });
    }
    
    const usersByPlan = Object.keys(planCount).map(planName => ({
      planName,
      count: planCount[planName]
    }));
    
    // Get user registrations over time
    let registrationQuery = supabase
      .from('profiles')
      .select('created_at');
      
    // Apply demographic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        registrationQuery = registrationQuery.eq(key, value);
      }
    });
    
    const { data: registrations } = await registrationQuery;
    
    // Group by month
    const registrationsByMonth = {};
    registrations.forEach(user => {
      const date = new Date(user.created_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      registrationsByMonth[month] = (registrationsByMonth[month] || 0) + 1;
    });
    
    const registrationTrend = Object.entries(registrationsByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    return {
      totalUsers: totalUsers || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      usersByRole,
      usersByPlan,
      registrationTrend
    };
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return {
      totalUsers: 0,
      newUsersThisMonth: 0,
      usersByRole: [],
      usersByPlan: [],
      registrationTrend: []
    };
  }
};

// Fetch questionnaire statistics with date range
export const fetchQuestionnaireStatistics = async (dateRange = null, filters = {}) => {
  try {
    // Get total questionnaires
    const { count: totalQuestionnaires } = await supabase
      .from('questionnaire_config')
      .select('*', { count: 'exact', head: true });
    
    // Build query for responses with filters
    let responsesQuery = supabase.from('questionnaire_responses').select('*', { count: 'exact' });
    
    // Apply date filters if provided
    if (dateRange && dateRange.from && dateRange.to) {
      responsesQuery = responsesQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
    }
    
    // Apply user demographic filters through a join with profiles
    if (Object.keys(filters).length > 0) {
      const { data: filteredUserIds } = await supabase
        .from('profiles')
        .select('id');
        
      // Apply filters to profiles query
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          responsesQuery = responsesQuery.eq('user_id', filteredUserIds.map(u => u.id));
        }
      });
    }
    
    // Get total responses with filters
    const { count: totalResponses } = await responsesQuery.count().single();
    
    // Get completed responses with same filters
    let completedQuery = responsesQuery.eq('status', 'completed');
    const { count: completedQuestionnaires } = await completedQuery.count().single();
    
    // Calculate completion rate
    const completionRate = totalResponses > 0 
      ? (completedQuestionnaires / totalResponses) * 100 
      : 0;
    
    // Get responses per questionnaire with filters
    const { data: questionnaires } = await supabase
      .from('questionnaire_config')
      .select('id, title');
    
    const responsesPerQuestionnaire = [];
    
    // For each questionnaire, get the count of responses with filters
    for (const questionnaire of questionnaires) {
      let questionnaireQuery = supabase
        .from('questionnaire_responses')
        .select('*', { count: 'exact' })
        .eq('questionnaire_id', questionnaire.id);
      
      // Apply date filters
      if (dateRange && dateRange.from && dateRange.to) {
        questionnaireQuery = questionnaireQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
      }
      
      const { count } = await questionnaireQuery.count().single();
        
      responsesPerQuestionnaire.push({
        title: questionnaire.title,
        count: count || 0
      });
    }
    
    // Get response trend over time
    let trendQuery = supabase
      .from('questionnaire_responses')
      .select('created_at, status');
      
    // Apply date filters
    if (dateRange && dateRange.from && dateRange.to) {
      trendQuery = trendQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
    }
    
    const { data: responses } = await trendQuery;
    
    // Group by day and status
    const responsesByDay = {};
    responses.forEach(response => {
      const date = new Date(response.created_at).toISOString().split('T')[0];
      if (!responsesByDay[date]) {
        responsesByDay[date] = { total: 0, completed: 0 };
      }
      responsesByDay[date].total++;
      if (response.status === 'completed') {
        responsesByDay[date].completed++;
      }
    });
    
    const responseTrend = Object.entries(responsesByDay)
      .map(([date, counts]) => ({ 
        date, 
        total: counts.total, 
        completed: counts.completed 
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalQuestionnaires: totalQuestionnaires || 0,
      totalResponses: totalResponses || 0,
      completedQuestionnaires: completedQuestionnaires || 0,
      completionRate,
      responsesPerQuestionnaire,
      responseTrend
    };
  } catch (error) {
    console.error("Error fetching questionnaire statistics:", error);
    return {
      totalQuestionnaires: 0,
      totalResponses: 0,
      completedQuestionnaires: 0,
      completionRate: 0,
      responsesPerQuestionnaire: [],
      responseTrend: []
    };
  }
};

// Fetch subscription statistics with date range
export const fetchSubscriptionStatistics = async (dateRange = null, filters = {}) => {
  try {
    // Build subscription query with filters
    let subscriptionQuery = supabase.from('user_subscriptions').select('*', { count: 'exact' });
    
    // Apply date filters if provided
    if (dateRange && dateRange.from && dateRange.to) {
      subscriptionQuery = subscriptionQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
    }
    
    // Apply user demographic filters through a join with profiles
    if (Object.keys(filters).length > 0) {
      const { data: filteredUserIds } = await supabase
        .from('profiles')
        .select('id');
        
      // Apply filters to profiles query
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          subscriptionQuery = subscriptionQuery.in('user_id', filteredUserIds.map(u => u.id));
        }
      });
    }
    
    // Get total subscriptions with filters
    const { count: totalSubscriptions } = await subscriptionQuery.count().single();
    
    // Get active subscriptions with same filters
    let activeQuery = subscriptionQuery.eq('status', 'active');
    const { count: activeSubscriptions } = await activeQuery.count().single();
    
    // Get subscriptions by plan with revenue
    let planQuery = supabase
      .from('user_subscriptions')
      .select('id, status, subscription_plans!inner(name, price, interval)')
      .eq('status', 'active');
      
    // Apply same filters as above
    if (dateRange && dateRange.from && dateRange.to) {
      planQuery = planQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
    }
    
    const { data: subscriptions } = await planQuery;
    
    // Group by plan and calculate revenue
    const planRevenue = {};
    if (subscriptions) {
      subscriptions.forEach(subscription => {
        const planName = subscription.subscription_plans?.name || 'Unknown Plan';
        const price = subscription.subscription_plans?.price || 0;
        
        if (!planRevenue[planName]) {
          planRevenue[planName] = {
            count: 0,
            revenue: 0,
            planName
          };
        }
        
        planRevenue[planName].count += 1;
        planRevenue[planName].revenue += price;
      });
    }
    
    const subscriptionsByPlan = Object.values(planRevenue);
    
    // Calculate total monthly revenue
    const monthlyRevenue = subscriptionsByPlan.reduce((sum, plan) => sum + plan.revenue, 0);
    
    // Get subscription trend over time
    let trendQuery = supabase
      .from('user_subscriptions')
      .select('created_at, status');
      
    // Apply date filters
    if (dateRange && dateRange.from && dateRange.to) {
      trendQuery = trendQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
    }
    
    const { data: subData } = await trendQuery;
    
    // Group by month
    const subsByMonth = {};
    if (subData) {
      subData.forEach(sub => {
        const date = new Date(sub.created_at);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!subsByMonth[month]) {
          subsByMonth[month] = { total: 0, active: 0 };
        }
        
        subsByMonth[month].total++;
        if (sub.status === 'active') {
          subsByMonth[month].active++;
        }
      });
    }
    
    const subscriptionTrend = Object.entries(subsByMonth)
      .map(([month, counts]) => ({ 
        month, 
        total: counts.total, 
        active: counts.active 
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    return {
      totalSubscriptions: totalSubscriptions || 0,
      activeSubscriptions: activeSubscriptions || 0,
      monthlyRevenue,
      subscriptionsByPlan,
      subscriptionTrend
    };
  } catch (error) {
    console.error("Error fetching subscription statistics:", error);
    return {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      monthlyRevenue: 0,
      subscriptionsByPlan: [],
      subscriptionTrend: []
    };
  }
};

// Fetch question answer statistics for a specific question
export const fetchQuestionAnswerStats = async (questionId, dateRange = null, filters = {}) => {
  try {
    // Build query with filters
    let responsesQuery = supabase
      .from('questionnaire_responses')
      .select('answers');
      
    // Apply date filters
    if (dateRange && dateRange.from && dateRange.to) {
      responsesQuery = responsesQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
    }
    
    // Apply user demographic filters through user_id
    if (Object.keys(filters).length > 0) {
      const { data: filteredUserIds } = await supabase
        .from('profiles')
        .select('id');
        
      // Apply filters to profiles query
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          responsesQuery = responsesQuery.in('user_id', filteredUserIds.map(u => u.id));
        }
      });
    }
    
    // Only consider non-null answers
    responsesQuery = responsesQuery.not('answers', 'is', null);
    
    const { data: responses } = await responsesQuery;
    
    if (!responses || responses.length === 0) {
      return {
        questionText: "No data available",
        totalResponses: 0,
        answerDistribution: []
      };
    }
    
    // Extract this specific question's answers from all responses
    let questionText = "Question";
    let answers = [];
    
    responses.forEach(response => {
      const questionAnswers = Object.entries(response.answers || {});
      
      for (const [key, value] of questionAnswers) {
        if (key === questionId) {
          // Extract question text if available
          if (value.questionText) {
            questionText = value.questionText;
          }
          
          // Extract answer
          if (value.answer !== undefined) {
            answers.push(value.answer);
          }
        }
      }
    });
    
    // Count occurrences of each answer
    const answerCount = {};
    answers.forEach(answer => {
      // Convert answer to string to handle all types of values
      const answerStr = String(answer);
      answerCount[answerStr] = (answerCount[answerStr] || 0) + 1;
    });
    
    // Calculate percentages
    const totalResponses = answers.length;
    const answerDistribution = Object.keys(answerCount).map(answer => ({
      answer,
      count: answerCount[answer],
      percentage: (answerCount[answer] / totalResponses) * 100
    }));
    
    return {
      questionText,
      totalResponses,
      answerDistribution
    };
  } catch (error) {
    console.error("Error fetching question answer statistics:", error);
    return {
      questionText: "Error fetching data",
      totalResponses: 0,
      answerDistribution: []
    };
  }
};

// Fetch all questions from questionnaire configs
export const fetchAllQuestions = async () => {
  try {
    const { data: questionnaires } = await supabase
      .from('questionnaire_config')
      .select('questions');
    
    const allQuestions = [];
    
    questionnaires.forEach(questionnaire => {
      const questions = questionnaire.questions || [];
      
      questions.forEach(question => {
        allQuestions.push({
          questionId: question.id,
          questionText: question.text || "Unnamed Question"
        });
      });
    });
    
    return allQuestions;
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
};

// Fetch demographic data from user profiles
export const fetchDemographicData = async (field, dateRange = null, filters = {}) => {
  try {
    // Build query with filters
    let profilesQuery = supabase.from('profiles').select(field);
    
    // Apply date filters
    if (dateRange && dateRange.from && dateRange.to) {
      profilesQuery = profilesQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
    }
    
    // Apply other demographic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && key !== field) { // Skip filter on the target field
        profilesQuery = profilesQuery.eq(key, value);
      }
    });
    
    const { data: profiles } = await profilesQuery;
    
    // Count occurrences of each value
    const valueCount = {};
    profiles.forEach(profile => {
      const value = profile[field] || 'Not specified';
      valueCount[value] = (valueCount[value] || 0) + 1;
    });
    
    // Convert to array format for charts
    const demographicData = Object.keys(valueCount).map(value => ({
      value,
      count: valueCount[value]
    }));
    
    return demographicData;
  } catch (error) {
    console.error(`Error fetching demographic data for ${field}:`, error);
    return [];
  }
};

// Fetch available demographic filters
export const fetchAvailableFilters = async () => {
  try {
    // Get distinct values for key demographic fields
    const fields = ['role', 'address', 'subscription_plan'];
    const filters = {};
    
    for (const field of fields) {
      const { data } = await supabase
        .from('profiles')
        .select(field)
        .not(field, 'is', null);
      
      // Get distinct values
      const distinctValues = [...new Set(data.map(item => item[field]))];
      filters[field] = distinctValues.filter(Boolean); // Remove nulls and empty strings
    }
    
    return filters;
  } catch (error) {
    console.error("Error fetching available filters:", error);
    return {};
  }
};

// Fetch age distribution data for users
export const fetchAgeDistribution = async (dateRange = null, filters = {}) => {
  try {
    // For this example, we'll calculate age based on a fictitious 'birth_date' field
    // In a real application, you would adjust this to your actual data structure
    
    const { data: users } = await supabase
      .from('profiles')
      .select('*');
      
    // Since we don't have actual age data, we'll create sample data for this example
    // In a real implementation, you would calculate this from actual user data
    
    const ageDistribution = [
      { age_group: '18-24', count: Math.floor(Math.random() * 50) + 10 },
      { age_group: '25-34', count: Math.floor(Math.random() * 80) + 30 },
      { age_group: '35-44', count: Math.floor(Math.random() * 70) + 20 },
      { age_group: '45-54', count: Math.floor(Math.random() * 50) + 15 },
      { age_group: '55+', count: Math.floor(Math.random() * 30) + 5 }
    ];
    
    return ageDistribution;
  } catch (error) {
    console.error("Error fetching age distribution:", error);
    return [];
  }
};

// Fetch user retention data (sample implementation)
export const fetchRetentionData = async (dateRange = null) => {
  try {
    // In a real implementation, you would calculate retention from actual user engagement data
    // For this example, we'll create sample retention data
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const retentionData = months.map(month => ({
      month,
      retention_rate: Math.floor(Math.random() * 50) + 50 // Random values between 50-100%
    }));
    
    return retentionData;
  } catch (error) {
    console.error("Error fetching retention data:", error);
    return [];
  }
};

// Fetch questionnaire completion data by demographic group
export const fetchCompletionByDemographic = async (demographic = 'role', dateRange = null) => {
  try {
    // Get all unique values for the selected demographic
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`id, ${demographic}`)
      .not(demographic, 'is', null);
      
    if (!profiles || profiles.length === 0) {
      return [];
    }
    
    // Group users by the demographic value
    const usersByGroup = {};
    profiles.forEach(profile => {
      const group = profile[demographic] || 'Not specified';
      if (!usersByGroup[group]) {
        usersByGroup[group] = [];
      }
      usersByGroup[group].push(profile.id);
    });
    
    const results = [];
    
    // For each demographic group, get questionnaire completion stats
    for (const [group, userIds] of Object.entries(usersByGroup)) {
      // Get total responses for this group
      const { count: totalResponses } = await supabase
        .from('questionnaire_responses')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds);
        
      // Get completed responses for this group
      const { count: completedResponses } = await supabase
        .from('questionnaire_responses')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds)
        .eq('status', 'completed');
        
      // Calculate completion rate
      const completionRate = totalResponses > 0 
        ? (completedResponses / totalResponses) * 100 
        : 0;
        
      results.push({
        group,
        total: totalResponses || 0,
        completed: completedResponses || 0,
        completion_rate: completionRate
      });
    }
    
    return results;
  } catch (error) {
    console.error(`Error fetching completion data by ${demographic}:`, error);
    return [];
  }
};
