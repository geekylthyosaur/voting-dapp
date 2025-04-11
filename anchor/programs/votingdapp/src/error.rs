use anchor_lang::error_code;

#[error_code]
pub enum Error {
    #[msg("Poll already exists")]
    PollAlreadyExists,
    #[msg(AlreadyVoted)]
    AlreadyVoted,
    #[msg("Candidate not found")]
    CandidateNotFound,
    #[msg("Invalid poll name")]
    InvalidPollName,
    #[msg("Invalid poll description")]
    InvalidPollDescription,
    #[msg("Invalid candidate name")]
    InvalidCandidateName,
    #[msg("Invalid candidates count")]
    InvalidCandidatesCount,
}
