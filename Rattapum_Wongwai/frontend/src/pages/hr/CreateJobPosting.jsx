import React from 'react';
import { useParams } from 'react-router-dom';
import JobPostingForm from '../../components/JobPostingForm';

export default function CreateJobPosting() {
  const { id } = useParams();
  const isNew = !id || id.toLowerCase() === 'new';
  return <JobPostingForm mode={isNew ? "new" : "from-request"} id={id} />;
}