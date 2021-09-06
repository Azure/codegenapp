/****** Object:  Table [dbo].[AMEClientTools_SDK_Code_Generation]    Script Date: 6/8/2021 4:08:32 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AMEClientTools_SDK_Code_Generation]') AND type in (N'U'))
DROP TABLE [dbo].[AMEClientTools_SDK_Code_Generation]
GO

/****** Object:  Table [dbo].[AMEClientTools_SDK_Code_Generation]    Script Date: 6/8/2021 4:08:32 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[AMEClientTools_SDK_Code_Generation](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](200) NOT NULL,
	[resourceProvider] [nvarchar](200) NOT NULL,
	[resourcesToGenerate] [nvarchar](500) NULL,
	[tag] [nvarchar](50) NULL,
	[sdk] [nvarchar](50) NULL,
	[type] [nvarchar](50) NULL,
	[ignoreFailure] [nvarchar](500) NULL,
	[excludeStages] [nvarchar](200) NULL,
	[latestPipelineBuildID] [nvarchar](50) NULL,
	[status] [nvarchar](50) NULL
) ON [PRIMARY]
GO