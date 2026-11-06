import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
// Common / Public Pages
import Dashboard from './pages/common/Dashboard';
import JobSearch from './pages/common/JobSearch';
import JobDetail from './pages/common/JobDetail';
import JobAnnouncementDetail from './pages/common/JobAnnouncementDetail';
import Sitemap from './pages/common/Sitemap';
import Login from './pages/common/Login';

// Applicant Pages
import JobApplication from './pages/applicant/JobApplication';
import MyApplications from './pages/applicant/MyApplications';
import ApplicationStatus from './pages/applicant/ApplicationStatus';

// Faculty Pages
import RequestJob from './pages/faculty/RequestJob';
import FacultyJobRequests from './pages/faculty/FacultyJobRequests';
import FacultyJobs from './pages/faculty/FacultyJobs';
import FacultyReviewApplicants from './pages/faculty/FacultyReviewApplicants';

// HR Pages
import JobRequests from './pages/hr/JobRequests';
import ManageJobPostings from './pages/hr/ManageJobPostings';
import CreateJobPosting from './pages/hr/CreateJobPosting';
import ReviewApplicants from './pages/hr/ReviewApplicants';
import ApplicantDetails from './pages/hr/ApplicantDetails';
import CreateExamAnnouncement from './pages/hr/CreateExamAnnouncement';
import ManageUsers from './pages/hr/ManageUsers';

// Report Pages
import ReportList from './pages/reports/ReportList';
import ReportSummary from './pages/reports/ReportSummary';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="jobs" element={<JobSearch />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/closed/:id" element={<JobAnnouncementDetail />} />
          <Route path="apply/:id" element={<JobApplication />} />
          <Route path="request-job" element={<RequestJob />} />
          <Route path="job-requests" element={<JobRequests />} />
          <Route path="create-job/new" element={<CreateJobPosting />} />
          <Route path="create-job/:id" element={<CreateJobPosting />} />
          <Route path="my-requests" element={<FacultyJobRequests />} />
          <Route path="review-applicants" element={<ReviewApplicants />} />
          <Route path="review-applicants/:id" element={<ReviewApplicants />} />
          <Route path="manage-jobs" element={<ManageJobPostings />} />
          <Route path="/applicant-details/:id" element={<ApplicantDetails />} />
          <Route path="create-exam-announcement/:id" element={<CreateExamAnnouncement />} />
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="faculty-review/:id" element={<FacultyReviewApplicants />} />
          <Route path="faculty-jobs" element={<FacultyJobs />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="my-status/:id" element={<ApplicationStatus />} />
          <Route path="/login" element={<Login />} />
          <Route path="my-applications" element={<MyApplications />} />
          <Route path="reports" element={<ReportList />} />
          <Route path="report/:id" element={<ReportSummary />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;