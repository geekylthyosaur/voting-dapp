use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Default)]
pub struct Poll {
    title: String,
    options: Vec<PollOption>,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug)]
struct PollOption {
    name: String,
    vote_count: u64,
}

impl<S: Into<String>> From<S> for PollOption {
    fn from(name: S) -> Self {
        Self {
            name: name.into(),
            vote_count: 0,
        }
    }
}

impl Poll {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_title(mut self, title: impl Into<String>) -> Self {
        self.title = title.into();
        self
    }

    pub fn with_options(mut self, options: Vec<impl Into<String>>) -> Self {
        let options = options.into_iter().map(|s| s.into()).collect::<Vec<_>>();
        self.options = options.into_iter().map(|s| s.into()).collect();
        self
    }

    pub fn size(&self) -> u64 {
        let options_len = 4 + self
            .options
            .iter()
            .map(|o| 4 + o.name.len() as u64 + 8)
            .sum::<u64>();
        options_len + 4 + self.title.len() as u64
    }

    pub fn vote(&mut self, vote: Vote) {
        if let Some(option) = self.options.get_mut(vote.0 as usize) {
            option.vote_count += 1;
        }
    }
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Copy, Debug)]
pub struct Vote(u8);

impl From<u8> for Vote {
    fn from(n: u8) -> Self {
        Self(n)
    }
}
