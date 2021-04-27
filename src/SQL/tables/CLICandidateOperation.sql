/****** Object:  Table [dbo].[AMEClientTools_Coverage_CLICandidateOperations]    Script Date: 4/26/2021 4:49:58 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AMEClientTools_Coverage_CLICandidateOperations]') AND type in (N'U'))
DROP TABLE [dbo].[AMEClientTools_Coverage_CLICandidateOperations]
GO

/****** Object:  Table [dbo].[AMEClientTools_Coverage_CLICandidateOperations]    Script Date: 4/26/2021 4:49:58 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[AMEClientTools_Coverage_CLICandidateOperations](
	[resourceProvider] [nvarchar](200) NOT NULL,
	[fullResourceType] [nvarchar](400) NULL,
	[fileName] [nvarchar](400) NULL,
	[apiVersion] [nvarchar](50) NULL,
	[tag] [nvarchar](50) NULL,
	[startDate] [nvarchar](50) NULL,
	[endDate] [nvarchar](50) NULL
) ON [PRIMARY]
GO
