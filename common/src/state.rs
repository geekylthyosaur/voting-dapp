use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshDeserialize, BorshSerialize, Clone, Copy, Debug)]
pub struct Poll {
    gm: u64,
    gn: u64,
}

impl Poll {
    pub const SIZE: usize = 16;

    pub fn vote(&mut self, vote: VoteType) {
        match vote {
            VoteType::GM => self.gm += 1,
            VoteType::GN => self.gn += 1,
        }
    }
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Copy, Debug)]
pub enum VoteType {
    GM,
    GN,
}
